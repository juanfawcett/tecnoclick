import express from 'express';
import { getDb } from '../db/db.js';
import { saveSetting, getSetting } from '../services/integrations.js';

const router = express.Router();

router.get('/settings', async (req, res) => {
  const db = getDb();
  try {
    const erp = await getSetting(db, 'erp');
    const wms = await getSetting(db, 'wms');
    const carriers = await getSetting(db, 'carriers');
    res.json({ erp, wms, carriers });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/settings', async (req, res) => {
  const db = getDb();
  try {
    const { erp = null, wms = null, carriers = null } = req.body;
    if (erp) await saveSetting(db, 'erp', erp);
    if (wms) await saveSetting(db, 'wms', wms);
    if (carriers) await saveSetting(db, 'carriers', carriers);
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

export default router;
