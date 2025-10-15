-- users
CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- products
CREATE TABLE IF NOT EXISTS products(
  id SERIAL PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT,
  description TEXT,
  price_cents INTEGER,
  active BOOLEAN DEFAULT TRUE,
  stock INTEGER DEFAULT 0,
  category TEXT,
  images TEXT,
  attributes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_discounts(
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  min_qty INTEGER,
  percent REAL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS reviews(
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  user_id INTEGER REFERENCES users(id),
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS favorites(
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  PRIMARY KEY(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS coupons(
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE,
  kind TEXT,           -- 'percent' | 'fixed'
  value INTEGER,       -- cents (fixed) o porcentaje entero
  min_cart_cents INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  active BOOLEAN DEFAULT TRUE
);

-- Carritos: mantenemos id TEXT (cookie)
CREATE TABLE IF NOT EXISTS carts(
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items(
  id SERIAL PRIMARY KEY,
  cart_id TEXT REFERENCES carts(id),
  product_id INTEGER REFERENCES products(id),
  qty INTEGER,
  price_cents_snapshot INTEGER
);

-- Órdenes: id es UUID/texto generado en app
CREATE TABLE IF NOT EXISTS orders(
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  email TEXT,
  shipping_address TEXT,
  billing_address TEXT,
  status TEXT,
  subtotal_cents INTEGER,
  discount_cents INTEGER,
  tax_cents INTEGER,
  total_cents INTEGER,
  coupon_code TEXT,
  payment_method TEXT,
  is_guest BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items(
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  name_snapshot TEXT,
  price_cents_snapshot INTEGER,
  qty INTEGER
);

CREATE TABLE IF NOT EXISTS invoices(
  id SERIAL PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  pdf_path TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quotes(
  id TEXT PRIMARY KEY,
  cart_id TEXT REFERENCES carts(id),
  user_id INTEGER REFERENCES users(id),
  email TEXT,
  pdf_path TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS layaways(
  id TEXT PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  product_id INTEGER REFERENCES products(id),
  total_cents INTEGER,
  deposit_cents INTEGER,
  paid_cents INTEGER DEFAULT 0,
  balance_cents INTEGER,
  installments INTEGER,
  status TEXT,
  order_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments(
  id SERIAL PRIMARY KEY,
  order_id TEXT,
  layaway_id TEXT,
  method TEXT,
  amount_cents INTEGER,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments(
  id SERIAL PRIMARY KEY,
  order_id TEXT,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT,
  history TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications(
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  email TEXT,
  subject TEXT,
  body TEXT,
  meta TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analytics_events(
  id SERIAL PRIMARY KEY,
  session_id TEXT,
  user_id INTEGER,
  event_type TEXT,
  payload TEXT,
  ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS settings(
  key TEXT PRIMARY KEY,
  value TEXT
);
