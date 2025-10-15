import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, get, run } from '../db/db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const db = getDb();
  try {
    const { name, email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email y password requeridos' });
    const dup = await get(db, `SELECT id FROM users WHERE email=$1`, [email]);
    if (dup) return res.status(400).json({ error: 'Email ya registrado' });
    const hash = await bcrypt.hash(password, 10);
    const r = await run(
      db,
      `INSERT INTO users (name,email,password_hash) VALUES ($1,$2,$3) RETURNING id`,
      [name || '', email, hash]
    );
    const user = { id: r.rows[0].id, email, role: 'user', name: name || '' };
    const token = jwt.sign(user, process.env.JWT_SECRET || 'changeme', {
      expiresIn: '7d',
    });
    res.cookie('tc_jwt', token, { httpOnly: true, sameSite: 'Lax' });
    res.json({ user });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error al registrar' });
  } finally {
    db.close();
  }
});

router.post('/login', async (req, res) => {
  const db = getDb();
  try {
    const { email, password } = req.body;
    const u = await get(db, `SELECT * FROM users WHERE email=$1`, [email]);
    if (!u) return res.status(400).json({ error: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, u.password_hash);
    if (!ok) return res.status(400).json({ error: 'Credenciales inválidas' });
    const user = { id: u.id, email: u.email, role: u.role, name: u.name };
    const token = jwt.sign(user, process.env.JWT_SECRET || 'changeme', {
      expiresIn: '7d',
    });
    res.cookie('tc_jwt', token, { httpOnly: true, sameSite: 'Lax' });
    res.json({ user });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  } finally {
    db.close();
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('tc_jwt');
  res.json({ ok: true });
});

router.get('/profile', authRequired, async (req, res) => {
  const db = getDb();
  try {
    const u = await get(
      db,
      `SELECT id,name,email,role,address FROM users WHERE id=$1`,
      [req.user.id]
    );
    res.json({
      user: { ...u, address: u.address ? JSON.parse(u.address) : null },
    });
  } catch (e) {
    console.error('🚀 ~ e:', e);
    res.status(500).json({ error: 'Error' });
  } finally {
    db.close();
  }
});

router.put('/profile', authRequired, async (req, res) => {
  console.log('🚀 ~ req:', req);
  const db = getDb();
  try {
    const { name, address } = req.body;
    await run(
      db,
      `UPDATE users SET name=$1, address=$2, updated_at=NOW() WHERE id=$3`,
      [name || '', JSON.stringify(address || {}), req.user.id]
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
