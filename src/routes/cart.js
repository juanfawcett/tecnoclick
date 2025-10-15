import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, get, all, run } from '../db/db.js';
import {
  applyQuantityDiscounts,
  totalsWithCoupon,
} from '../services/pricing.js';
import { validateCoupon } from '../services/coupons.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

function getCartId(req, res) {
  let cid = req.cookies['tc_cart'];
  if (!cid) {
    cid = uuidv4();
    res.cookie('tc_cart', cid, {
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    });
  }
  return cid;
}

router.get('/', async (req, res) => {
  const db = getDb();
  try {
    const cartId = getCartId(req, res);
    let cart = await get(db, `SELECT * FROM carts WHERE id=$1`, [cartId]);
    if (!cart) {
      await run(db, `INSERT INTO carts (id,user_id) VALUES ($1,NULL)`, [
        cartId,
      ]);
    }
    const items = await all(
      db,
      `SELECT ci.*, p.name, p.price_cents, p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE cart_id=$1`,
      [cartId]
    );
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
    res.json({ cartId, items: merged });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/items', async (req, res) => {
  const db = getDb();
  try {
    const { product_id, qty } = req.body;
    const p = await get(db, `SELECT * FROM products WHERE id=$1 AND active=1`, [
      product_id,
    ]);
    if (!p) return res.status(404).json({ error: 'Producto no disponible' });
    if (qty < 1) return res.status(400).json({ error: 'Cantidad inválida' });
    const cartId = req.cookies['tc_cart'] || null;
    let cid = cartId;
    if (!cid) {
      // Set on response
      // handled by getCartId below (re-using func)
    }
    const ensuredId = (function () {
      let temp;
      return (temp = getCartId(req, res));
    })();
    const existing = await get(
      db,
      `SELECT * FROM cart_items WHERE cart_id=$1 AND product_id=$2`,
      [ensuredId, product_id]
    );
    if (existing) {
      await run(db, `UPDATE cart_items SET qty=qty+$1 WHERE id=$2`, [
        qty,
        existing.id,
      ]);
    } else {
      await run(
        db,
        `INSERT INTO cart_items (cart_id,product_id,qty,price_cents_snapshot) VALUES ($1,$2,$3,$4)`,
        [ensuredId, product_id, qty, p.price_cents]
      );
    }
    await run(db, `UPDATE carts SET updated_at=NOW() WHERE id=$1`, [ensuredId]);
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.put('/items/:id', async (req, res) => {
  const db = getDb();
  try {
    const { qty } = req.body;
    if (qty < 1) return res.status(400).json({ error: 'Cantidad inválida' });
    await run(db, `UPDATE cart_items SET qty=$1 WHERE id=$2`, [
      qty,
      req.params.id,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.delete('/items/:id', async (req, res) => {
  const db = getDb();
  try {
    await run(db, `DELETE FROM cart_items WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/apply-coupon', async (req, res) => {
  const db = getDb();
  try {
    const { code } = req.body;
    const cartId = req.cookies['tc_cart'];
    const items = await all(
      db,
      `SELECT ci.*, p.name, p.price_cents, p.stock FROM cart_items ci JOIN products p ON p.id=ci.product_id WHERE cart_id=$1`,
      [cartId]
    );
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
    const coupon = await validateCoupon(db, code);
    if (!coupon) return res.status(400).json({ error: 'Cupón inválido' });
    const totals = totalsWithCoupon(merged, coupon);
    res.json({ coupon, totals });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

// Favoritos
router.get('/favorites', authRequired, async (req, res) => {
  const db = getDb();
  try {
    const rows = await all(
      db,
      `SELECT p.* FROM favorites f JOIN products p ON p.id=f.product_id WHERE f.user_id=$1`,
      [req.user.id]
    );
    rows.forEach((r) => {
      r.images = r.images ? JSON.parse(r.images) : [];
      r.attributes = r.attributes ? JSON.parse(r.attributes) : {};
    });
    res.json({ favorites: rows });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/favorites/:productId', authRequired, async (req, res) => {
  const db = getDb();
  try {
    await run(
      db,
      `INSERT INTO favorites (user_id,product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [req.user.id, req.params.productId]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});
router.delete('/favorites/:productId', authRequired, async (req, res) => {
  const db = getDb();
  try {
    await run(db, `DELETE FROM favorites WHERE user_id=$1 AND product_id=$2`, [
      req.user.id,
      req.params.productId,
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

export default router;
