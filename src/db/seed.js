import bcrypt from 'bcryptjs';
import { sql } from '@vercel/postgres';

async function main() {
  const adminPass = await bcrypt.hash('Admin123!', 10);
  const userPass = await bcrypt.hash('User123!', 10);

  await sql`INSERT INTO users (name,email,password_hash,role)
            VALUES ('Admin','admin@tecnoclick.com',${adminPass},'admin')
            ON CONFLICT (email) DO NOTHING;`;

  await sql`INSERT INTO users (name,email,password_hash,role)
            VALUES ('Usuario','user@tecnoclick.com',${userPass},'user')
            ON CONFLICT (email) DO NOTHING;`;

  // Productos demo
  await sql`INSERT INTO products (sku,name,description,price_cents,active,stock,category,images,attributes)
            VALUES ('SKU-IPH13','iPhone 13 128GB','Smartphone...',2999000,true,15,'Smartphones','["/assets/sample/iphone13.jpg"]','{"marca":"Apple","almacenamiento":"128GB","color":"Midnight"}')
            ON CONFLICT (sku) DO NOTHING;`;

  await sql`INSERT INTO products (sku,name,description,price_cents,active,stock,category,images,attributes)
            VALUES ('SKU-GS23','Samsung Galaxy S23','Pantalla 120Hz...',2599000,true,25,'Smartphones','["/assets/sample/galaxy-s23.jpg"]','{"marca":"Samsung"}')
            ON CONFLICT (sku) DO NOTHING;`;

  await sql`INSERT INTO coupons (code,kind,value,min_cart_cents,max_uses,active)
            VALUES ('TECNO10','percent',10,200000,0,true)
            ON CONFLICT (code) DO NOTHING;`;

  // Descuentos por cantidad (AirPods)
  const airpods = await sql`SELECT id FROM products WHERE sku='SKU-AIRP'`;
  if (airpods.rows[0]) {
    await sql`INSERT INTO product_discounts (product_id,min_qty,percent,active)
              VALUES (${airpods.rows[0].id},3,10,true)`;
  }
  console.log('Seed PG OK');
}
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
