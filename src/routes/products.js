import express from 'express';
import { getDb, all, get, run } from '../db/db.js';
import { authRequired, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const db = getDb();
  try {
    const { search = '', category = '' } = req.query;
    const q = `%${search}%`;
    const rows = await all(
      db,
      `SELECT * FROM products WHERE active=1 AND name LIKE ? AND (?='' OR category=?)`,
      [q, category, category]
    );
    rows.forEach((r) => {
      r.images = r.images ? JSON.parse(r.images) : [];
      r.attributes = r.attributes ? JSON.parse(r.attributes) : {};
    });
    res.json({ products: rows });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.get('/:id', async (req, res) => {
  const db = getDb();
  try {
    const p = await get(db, `SELECT * FROM products WHERE id=?`, [
      req.params.id,
    ]);
    if (!p) return res.status(404).json({ error: 'No encontrado' });
    p.images = p.images ? JSON.parse(p.images) : [];
    p.attributes = p.attributes ? JSON.parse(p.attributes) : {};
    res.json({ product: p });
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
      sku,
      name,
      description,
      price_cents,
      stock,
      category,
      images = [],
      attributes = {},
      active = 1,
    } = req.body;
    const r = await run(
      db,
      `INSERT INTO products (sku,name,description,price_cents,stock,category,images,attributes,active)
      VALUES (?,?,?,?,?,?,?,?,?)`,
      [
        sku,
        name,
        description,
        price_cents,
        stock,
        category,
        JSON.stringify(images),
        JSON.stringify(attributes),
        active,
      ]
    );
    res.json({ id: r.lastID });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error al crear' });
  } finally {
    db.close();
  }
});

router.put('/:id', authRequired, adminOnly, async (req, res) => {
  const db = getDb();
  try {
    const {
      name,
      description,
      price_cents,
      stock,
      category,
      images,
      attributes,
      active,
    } = req.body;
    await run(
      db,
      `UPDATE products SET name=?, description=?, price_cents=?, stock=?, category=?, images=?, attributes=?, active=?, updated_at=datetime('now') WHERE id=?`,
      [
        name,
        description,
        price_cents,
        stock,
        category,
        JSON.stringify(images || []),
        JSON.stringify(attributes || {}),
        active ? 1 : 0,
        req.params.id,
      ]
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error al actualizar' });
  } finally {
    db.close();
  }
});

router.delete('/:id', authRequired, adminOnly, async (req, res) => {
  const db = getDb();
  try {
    await run(db, `UPDATE products SET active=0 WHERE id=?`, [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error al desactivar' });
  } finally {
    db.close();
  }
});

router.get('/:id/reviews', async (req, res) => {
  const db = getDb();
  try {
    const rows = await all(
      db,
      `SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE product_id=? ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json({ reviews: rows });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/:id/reviews', authRequired, async (req, res) => {
  const db = getDb();
  try {
    const { rating, comment } = req.body;
    await run(
      db,
      `INSERT INTO reviews (product_id,user_id,rating,comment) VALUES (?,?,?,?)`,
      [req.params.id, req.user.id, rating, comment || '']
    );
    res.json({ ok: true });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.post('/compare', async (req, res) => {
  const db = getDb();
  try {
    const { ids = [] } = req.body;
    if (!Array.isArray(ids) || ids.length === 0)
      return res.json({ products: [] });
    const placeholders = ids.map(() => '?').join(',');
    const rows = await all(
      db,
      `SELECT * FROM products WHERE id IN (${placeholders})`,
      ids
    );
    rows.forEach((r) => {
      r.images = r.images ? JSON.parse(r.images) : [];
      r.attributes = r.attributes ? JSON.parse(r.attributes) : {};
    });
    res.json({ products: rows });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

export default router;
