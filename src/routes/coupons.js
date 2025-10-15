import express from 'express';
import { getDb, get, all, run } from '../db/db.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authRequired, adminOnly, async (req, res) => {
  const db = getDb();
  try {
    const rows = await all(db, `SELECT * FROM coupons`, []);
    res.json({ coupons: rows });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/', authRequired, adminOnly, async (req, res) => {
  const db = getDb();
  try {
    const {
      code,
      kind,
      value,
      min_cart_cents = 0,
      max_uses = 0,
      start_date = null,
      end_date = null,
      active = 1,
    } = req.body;
    await run(
      db,
      `INSERT INTO coupons (code,kind,value,min_cart_cents,max_uses,start_date,end_date,active) VALUES (?,?,?,?,?,?,?,?)`,
      [
        code,
        kind,
        value,
        min_cart_cents,
        max_uses,
        start_date,
        end_date,
        active ? 1 : 0,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

export default router;
