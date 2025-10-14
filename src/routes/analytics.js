
import express from 'express';
import { getDb, all, run } from '../db/db.js';
import { recordEvent } from '../services/analytics.js';

const router = express.Router();

router.post('/event', async (req, res) => {
  const db = getDb();
  try {
    const { event_type, payload={} } = req.body;
    await recordEvent(db, { session_id: req.sessionId, user_id: (req.user && req.user.id) || null, event_type, payload });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.get('/funnel', async (req, res) => {
  const db = getDb();
  try {
    const views = await all(db, `SELECT COUNT(DISTINCT session_id) as n FROM analytics_events WHERE event_type='view_product'`);
    const carts = await all(db, `SELECT COUNT(DISTINCT session_id) as n FROM analytics_events WHERE event_type='add_to_cart'`);
    const checkouts = await all(db, `SELECT COUNT(DISTINCT session_id) as n FROM analytics_events WHERE event_type='checkout_started'`);
    const purchases = await all(db, `SELECT COUNT(DISTINCT session_id) as n FROM analytics_events WHERE event_type='purchase'`);
    res.json({ funnel: { views: views[0].n, carts: carts[0].n, checkouts: checkouts[0].n, purchases: purchases[0].n } });
  } catch (e) {
    res.status(500).json({ error: 'Error' });
  } finally { db.close(); }
});

export default router;
