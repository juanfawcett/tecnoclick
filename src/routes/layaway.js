import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, get, run } from '../db/db.js';
import { authRequired } from '../middleware/auth.js';
import { notify } from '../services/notifications.js';
import { generateInvoice } from '../services/invoice.js';

const router = express.Router();

router.post('/create', authRequired, async (req, res) => {
  const db = getDb();
  try {
    const { product_id, deposit_percent = 20, installments = 3 } = req.body;
    const p = await get(db, `SELECT * FROM products WHERE id=? AND active=1`, [
      product_id,
    ]);
    if (!p) return res.status(404).json({ error: 'Producto no disponible' });
    const total = p.price_cents;
    const deposit = Math.floor(total * (deposit_percent / 100));
    const layawayId = uuidv4();
    await run(
      db,
      `INSERT INTO layaways (id,user_id,product_id,total_cents,deposit_cents,paid_cents,balance_cents,installments,status) VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        layawayId,
        req.user.id,
        product_id,
        total,
        deposit,
        0,
        total,
        installments,
        'active',
      ]
    );
    res.json({
      layaway_id: layawayId,
      deposit_cents: deposit,
      total_cents: total,
    });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/:id/pay', authRequired, async (req, res) => {
  const db = getDb();
  try {
    const { amount_cents } = req.body;
    const lw = await get(
      db,
      `SELECT * FROM layaways WHERE id=? AND user_id=?`,
      [req.params.id, req.user.id]
    );
    if (!lw) return res.status(404).json({ error: 'Plan no encontrado' });
    const newPaid = lw.paid_cents + amount_cents;
    const newBalance = Math.max(0, lw.total_cents - newPaid);
    let status = lw.status;
    if (newPaid >= lw.total_cents) status = 'completed';
    await run(
      db,
      `UPDATE layaways SET paid_cents=?, balance_cents=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [newPaid, newBalance, status, lw.id]
    );
    if (status === 'completed') {
      // Generar orden de envío y factura
      const orderId = 'L-' + lw.id;
      await run(
        db,
        `INSERT INTO orders (id,user_id,email,shipping_address,billing_address,status,subtotal_cents,discount_cents,tax_cents,total_cents,payment_method,is_guest)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,0)`,
        [
          orderId,
          lw.user_id,
          null,
          '{}',
          '{}',
          'paid',
          lw.total_cents,
          0,
          Math.floor(lw.total_cents * 0.19),
          Math.floor(lw.total_cents * 1.19),
          'layaway',
        ]
      );
      await run(
        db,
        `INSERT INTO order_items (order_id,product_id,name_snapshot,price_cents_snapshot,qty) VALUES (?,?,?,?,1)`,
        [orderId, lw.product_id, 'Artículo plan separe', lw.total_cents]
      );
      await generateInvoice(db, orderId);
      await notify(db, {
        user_id: lw.user_id,
        email: 'usuario@correo',
        subject: 'Plan Separe completado',
        body: `¡Has completado el pago del plan separe ${lw.id}!`,
      });
    }
    res.json({ ok: true, status: status, balance_cents: newBalance });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

export default router;
