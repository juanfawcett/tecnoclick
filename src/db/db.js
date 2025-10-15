import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sql } from '@vercel/postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ensured = false;

export async function ensureDb() {
  try {
    if (ensured) return;
    ensured = true;
    // Ejecuta migraciones (schema_pg.sql) una vez por cold start
    const schemaPath = path.join(__dirname, 'schema.sql');
    const ddl = fs.readFileSync(schemaPath, 'utf-8');
    // dividir por ';' de forma simple
    const statements = ddl
      .split(/;\s*$/m)
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await sql.query(stmt);
    }
  } catch (e) {
    console.error('🚀 ~ ensureDb ~ e:', e);
  }
}

export function getDb() {
  // @vercel/postgres expone 'sql' directamente; lo retornamos por consistencia
  return sql;
}

// Helpers (mismo API que antes pero versión PG)
export async function run(db, q, params = []) {
  return db.query(q, params);
}
export async function get(db, q, params = []) {
  const r = await db.query(q, params);
  return r.rows[0] || null;
}
export async function all(db, q, params = []) {
  const r = await db.query(q, params);
  return r.rows || [];
}
