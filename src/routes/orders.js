import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, get, all, run } from '../db/db.js';
import { validateCoupon, consumeCoupon } from '../services/coupons.js';
import {
  applyQuantityDiscounts,
  totalsWithCoupon,
} from '../services/pricing.js';
import { antifraudCheck } from '../middleware/antifraud.js';
import { authRequired } from '../middleware/auth.js';
import { generateInvoice } from '../services/invoice.js';
import { notify } from '../services/notifications.js';

const router = express.Router();

async function buildCartPricing(db, cartId, couponCode) {
  const items = await all(
    db,
    `SELECT ci.*, p.name, p.price_cents, p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE cart_id=?`,
    [cartId]
  );
  if (items.length === 0)
    return {
      items: [],
      totals: { subtotal: 0, discount: 0, tax: 0, total: 0 },
      coupon: null,
    };
  const withDiscounts = await applyQuantityDiscounts(
    db,
    items.map((it) => ({
      product_id: it.product_id,
      qty: it.qty,
      price_cents: it.price_cents,
    }))
  );
  const merged = items.map((it, idx) => ({
    ...it,
    discounted_price_cents: withDiscounts[idx].discounted_price_cents,
  }));
  const coupon = await validateCoupon(db, couponCode);
  const totals = totalsWithCoupon(merged, coupon);
  return { items: merged, totals, coupon };
}

router.post('/checkout', antifraudCheck, async (req, res) => {
  const db = getDb();
  try {
    const cartId = req.cookies['tc_cart'];
    const { email, shipping, billing, coupon_code, payment_method } = req.body;
    const pricing = await buildCartPricing(db, cartId, coupon_code);
    if (pricing.items.length === 0)
      return res.status(400).json({ error: 'Carrito vacío' });
    // Validar stock
    for (const it of pricing.items) {
      const p = await get(db, `SELECT stock FROM products WHERE id=?`, [
        it.product_id,
      ]);
      if (it.qty > p.stock)
        return res
          .status(400)
          .json({ error: `Stock insuficiente para ${it.name}` });
    }

    // Antifraude
    const decision = req.antifraud.decision;

    const orderId = uuidv4();
    await run(
      db,
      `INSERT INTO orders (id,user_id,email,shipping_address,billing_address,status,subtotal_cents,discount_cents,tax_cents,total_cents,coupon_code,payment_method,is_guest)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        orderId,
        null,
        email,
        JSON.stringify(shipping || {}),
        JSON.stringify(billing || {}),
        decision === 'reject' ? 'rejected' : 'pending_payment',
        pricing.totals.subtotal,
        pricing.totals.discount,
        pricing.totals.tax,
        pricing.totals.total,
        pricing.coupon?.code || null,
        payment_method,
        1,
      ]
    );

    for (const it of pricing.items) {
      await run(
        db,
        `INSERT INTO order_items (order_id,product_id,name_snapshot,price_cents_snapshot,qty) VALUES (?,?,?,?,?)`,
        [orderId, it.product_id, it.name, it.discounted_price_cents, it.qty]
      );
    }

    if (pricing.coupon) await consumeCoupon(db, pricing.coupon.code);

    if (decision === 'reject') {
      await notify(db, {
        email,
        subject: 'Orden rechazada por seguridad',
        body: `Tu orden ${orderId} ha sido rechazada por nuestro sistema antifraude.`,
      });
      return res.status(400).json({ error: 'Orden rechazada por seguridad' });
    }
    if (decision === 'review') {
      await run(db, `UPDATE orders SET status='under_review' WHERE id=?`, [
        orderId,
      ]);
      await notify(db, {
        email,
        subject: 'Orden en revisión',
        body: `Tu orden ${orderId} está en revisión manual. Te notificaremos pronto.`,
      });
      return res.json({ order_id: orderId, status: 'under_review' });
    }

    // OK para pago
    res.json({ order_id: orderId, status: 'pending_payment' });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error en checkout' });
  } finally {
    db.close();
  }
});

router.get('/:orderId', async (req, res) => {
  const db = getDb();
  try {
    const o = await get(db, `SELECT * FROM orders WHERE id=?`, [
      req.params.orderId,
    ]);
    if (!o) return res.status(404).json({ error: 'No encontrado' });
    const items = await all(db, `SELECT * FROM order_items WHERE order_id=?`, [
      req.params.orderId,
    ]);
    res.json({ order: o, items });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/:orderId/confirm', async (req, res) => {
  const db = getDb();
  try {
    const { success = true } = req.body;
    const o = await get(db, `SELECT * FROM orders WHERE id=?`, [
      req.params.orderId,
    ]);
    if (!o) return res.status(404).json({ error: 'No encontrado' });
    if (!success) {
      await run(db, `UPDATE orders SET status='payment_failed' WHERE id=?`, [
        o.id,
      ]);
      return res.json({ ok: true });
    }
    // Marcar pagado, descontar stock, generar factura
    await run(db, `UPDATE orders SET status='paid' WHERE id=?`, [o.id]);
    const items = await all(db, `SELECT * FROM order_items WHERE order_id=?`, [
      o.id,
    ]);
    for (const it of items) {
      await run(db, `UPDATE products SET stock = stock - ? WHERE id=?`, [
        it.qty,
        it.product_id,
      ]);
    }
    const pdf = await generateInvoice(db, o.id);
    // Notificar
    await notify(db, {
      email: o.email,
      subject: 'Pago confirmado',
      body: `Tu pago de la orden ${o.id} fue confirmado. Factura: ${pdf}`,
    });
    res.json({ ok: true, invoice: pdf });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

export default router;
