
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  email TEXT UNIQUE,
  password_hash TEXT,
  role TEXT DEFAULT 'user',
  address TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS products(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sku TEXT UNIQUE,
  name TEXT,
  description TEXT,
  price_cents INTEGER,
  active INTEGER DEFAULT 1,
  stock INTEGER DEFAULT 0,
  category TEXT,
  images TEXT,
  attributes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_discounts(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  min_qty INTEGER,
  percent REAL,
  start_date TEXT,
  end_date TEXT,
  active INTEGER DEFAULT 1,
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS reviews(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  user_id INTEGER,
  rating INTEGER,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(product_id) REFERENCES products(id),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS favorites(
  user_id INTEGER,
  product_id INTEGER,
  PRIMARY KEY(user_id, product_id),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS coupons(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE,
  kind TEXT, -- 'percent' or 'fixed'
  value INTEGER, -- cents for fixed, percent as integer (e.g. 10=10%)
  min_cart_cents INTEGER DEFAULT 0,
  max_uses INTEGER DEFAULT 0,
  used_count INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  active INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS carts(
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cart_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cart_id TEXT,
  product_id INTEGER,
  qty INTEGER,
  price_cents_snapshot INTEGER,
  FOREIGN KEY(cart_id) REFERENCES carts(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS orders(
  id TEXT PRIMARY KEY,
  user_id INTEGER,
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
  is_guest INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  product_id INTEGER,
  name_snapshot TEXT,
  price_cents_snapshot INTEGER,
  qty INTEGER,
  FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS invoices(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  pdf_path TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS quotes(
  id TEXT PRIMARY KEY,
  cart_id TEXT,
  user_id INTEGER,
  email TEXT,
  pdf_path TEXT,
  expires_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(cart_id) REFERENCES carts(id)
);

CREATE TABLE IF NOT EXISTS layaways(
  id TEXT PRIMARY KEY,
  user_id INTEGER,
  product_id INTEGER,
  total_cents INTEGER,
  deposit_cents INTEGER,
  paid_cents INTEGER DEFAULT 0,
  balance_cents INTEGER,
  installments INTEGER,
  status TEXT,
  order_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id),
  FOREIGN KEY(product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS payments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  layaway_id TEXT,
  method TEXT,
  amount_cents INTEGER,
  status TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS shipments(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT,
  history TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS notifications(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  email TEXT,
  subject TEXT,
  body TEXT,
  meta TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS analytics_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  user_id INTEGER,
  event_type TEXT,
  payload TEXT,
  ts TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings(
  key TEXT PRIMARY KEY,
  value TEXT
);
