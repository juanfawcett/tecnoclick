import express from 'express';
import { getDb, all, get, run } from '../db/db.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/dashboard', authRequired, adminOnly, async (req, res) => {
  const db = getDb();
  try {
    const sales = await all(
      db,
      `SELECT date(created_at) as day, SUM(total_cents) as total FROM orders WHERE status IN ('paid','shipped','delivered') GROUP BY day ORDER BY day DESC LIMIT 30`
    );
    const topProducts = await all(
      db,
      `SELECT p.name, SUM(oi.qty) as qty FROM order_items oi JOIN products p ON p.id=oi.product_id GROUP BY oi.product_id ORDER BY qty DESC LIMIT 5`
    );
    res.json({ sales, topProducts });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.get('/reports', authRequired, adminOnly, async (req, res) => {
  const db = getDb();
  try {
    const { from, to } = req.query;
    const rows = await all(
      db,
      `SELECT * FROM orders WHERE date(created_at) BETWEEN date(?) AND date(?)`,
      [from, to]
    );
    res.json({ orders: rows });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

export default router;
