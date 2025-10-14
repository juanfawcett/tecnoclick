
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'tecnoclick.sqlite');
const db = new sqlite3.Database(dbPath);

function run(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err); else resolve(this);
    });
  });
}
function get(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, function(err, row) {
      if (err) reject(err); else resolve(row);
    });
  });
}
function all(sql, params=[]) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, function(err, rows) {
      if (err) reject(err); else resolve(rows);
    });
  });
}

(async () => {
  try {
    const adminPass = await bcrypt.hash('Admin123!', 10);
    const userPass = await bcrypt.hash('User123!', 10);
    await run(`INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES (?,?,?,?)`,
      ['Admin', 'admin@tecnoclick.com', adminPass, 'admin']);
    await run(`INSERT OR IGNORE INTO users (name,email,password_hash,role) VALUES (?,?,?,?)`,
      ['Usuario', 'user@tecnoclick.com', userPass, 'user']);

    const sampleProducts = [
      ['SKU-IPH13', 'iPhone 13 128GB', 'Smartphone Apple con cámara dual...', 2999000, 1, 15, 'Smartphones', JSON.stringify(['/assets/sample/iphone13.jpg']), JSON.stringify({marca:'Apple', almacenamiento:'128GB', color:'Midnight'})],
      ['SKU-GS23', 'Samsung Galaxy S23', 'Pantalla AMOLED 120Hz...', 2599000, 1, 25, 'Smartphones', JSON.stringify(['/assets/sample/galaxy-s23.jpg']), JSON.stringify({marca:'Samsung', almacenamiento:'256GB', color:'Black'})],
      ['SKU-LAPX1', 'Laptop X1 Carbon', 'Ultraliviana, i7, 16GB RAM, 512GB SSD', 5399000, 1, 10, 'Laptops', JSON.stringify(['/assets/sample/x1.jpg']), JSON.stringify({marca:'Lenovo', ram:'16GB', almacenamiento:'512GB'})],
      ['SKU-AIRP', 'AirPods Pro 2', 'Cancelación activa de ruido', 1099000, 1, 40, 'Audio', JSON.stringify(['/assets/sample/airpods.jpg']), JSON.stringify({marca:'Apple'})]
    ];

    for (const p of sampleProducts) {
      await run(`INSERT OR IGNORE INTO products (sku,name,description,price_cents,active,stock,category,images,attributes)
        VALUES (?,?,?,?,?,?,?,?,?)`, p);
    }

    // Discounts: 3+ unidades 10% en AirPods
    const airpods = await get(`SELECT id FROM products WHERE sku='SKU-AIRP'`);
    if (airpods) {
      await run(`INSERT OR IGNORE INTO product_discounts (product_id,min_qty,percent,active) VALUES (?,?,?,1)`,
        [airpods.id, 3, 10]);
    }

    // Coupon: TECNO10 (10%)
    await run(`INSERT OR IGNORE INTO coupons (code,kind,value,min_cart_cents,max_uses,active) VALUES (?,?,?,?,?,1)`,
      ['TECNO10', 'percent', 10, 200000, 0]);

    console.log('Seed cargado.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
