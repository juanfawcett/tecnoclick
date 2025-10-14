
import { get, run } from '../db/db.js';

export async function validateCoupon(db, code) {
  if (!code) return null;
  const c = await get(db, `SELECT * FROM coupons WHERE code=? AND active=1`, [code]);
  if (!c) return null;
  const now = new Date();
  if (c.start_date && new Date(c.start_date) > now) return null;
  if (c.end_date && new Date(c.end_date) < now) return null;
  if (c.max_uses && c.max_uses > 0 && c.used_count >= c.max_uses) return null;
  return c;
}

export async function consumeCoupon(db, code) {
  await run(db, `UPDATE coupons SET used_count = used_count + 1 WHERE code=?`, [code]);
}
