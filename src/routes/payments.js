import express from 'express';
import { getDb, get, run } from '../db/db.js';
import { initMockPayment } from '../services/payment.js';

const router = express.Router();

router.post('/init', async (req, res) => {
  const db = getDb();
  try {
    const { order_id, method } = req.body;
    const o = await get(db, `SELECT * FROM orders WHERE id=?`, [order_id]);
    if (!o) return res.status(404).json({ error: 'Orden no encontrada' });
    const data = initMockPayment({
      order_id,
      amount_cents: o.total_cents,
      method,
    });
    res.json(data);
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/mock/confirm', async (req, res) => {
  const db = getDb();
  try {
    const { order_id, success = true } = req.body;
    // marcar pagado
    await run(db, `UPDATE orders SET status=? WHERE id=?`, [
      success ? 'paid' : 'payment_failed',
      order_id,
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
