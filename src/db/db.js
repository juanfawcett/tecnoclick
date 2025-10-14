
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFile = path.join(__dirname, 'tecnoclick.sqlite');

export async function ensureDb() {
  if (!fs.existsSync(dbFile)) {
    console.log('Creando base de datos...');
    const { spawnSync } = await import('node:child_process');
    const migrate = spawnSync('node', [path.join(__dirname, 'migrate.js')], { stdio: 'inherit' });
    if (migrate.status !== 0) {
      throw new Error('Migración fallida');
    }
    const seed = spawnSync('node', [path.join(__dirname, 'seed.js')], { stdio: 'inherit' });
    if (seed.status !== 0) {
      throw new Error('Seed fallido');
    }
  }
}

export function getDb() {
  const db = new sqlite3.Database(dbFile);
  return db;
}

// Helpers promisificados
export function run(db, sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err); else resolve(this);
    });
  });
}
export function get(db, sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function(err, row) {
      if (err) reject(err); else resolve(row);
    });
  });
}
export function all(db, sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows) {
      if (err) reject(err); else resolve(rows);
    });
  });
}
