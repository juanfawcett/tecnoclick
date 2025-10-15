import { get, run } from '../db/db.js';

export async function saveSetting(db, key, value) {
  await run(
    db,
    `INSERT INTO settings (key,value) VALUES ($1,$2)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [key, JSON.stringify(value)]
  );
}

export async function getSetting(db, key) {
  const row = await get(db, `SELECT value FROM settings WHERE key=$1`, [key]);
  return row ? JSON.parse(row.value) : null;
}
