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
      `SELECT * FROM products WHERE active=TRUE AND name LIKE $1 AND ($2='' OR category=$3)`,
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
    const p = await get(db, `SELECT * FROM products WHERE id=$1`, [
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
      active = 'TRUE',
    } = req.body;
    const r = await run(
      db,
      `INSERT INTO products (sku,name,description,price_cents,stock,category,images,attributes,active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
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
    res.json({ id: r.rows[0].id });
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
      `UPDATE products SET name=$1, description=$2, price_cents=$3, stock=$4, category=$5, images=$6, attributes=$7, active=$8, updated_at=NOW() WHERE id=$9`,
      [
        name,
        description,
        price_cents,
        stock,
        category,
        JSON.stringify(images || []),
        JSON.stringify(attributes || {}),
        active ? 'TRUE' : 'FALSE',
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
    await run(db, `UPDATE products SET active=FALSE WHERE id=$1`, [
      req.params.id,
    ]);
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
      `SELECT r.*, u.name as user_name FROM reviews r JOIN users u ON u.id=r.user_id WHERE product_id=$1 ORDER BY created_at DESC`,
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
      `INSERT INTO reviews (product_id,user_id,rating,comment) VALUES ($1,$2,$3,$4)`,
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
    const placeholders = ids.map((_id, i) => `${i + 1}`).join(',');
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
