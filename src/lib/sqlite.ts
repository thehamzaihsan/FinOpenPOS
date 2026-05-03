import { randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";

// Node 22+ builtin SQLite driver.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { DatabaseSync } from "node:sqlite";

const DB_PATH = join(process.cwd(), "data", "finopenpos.db");

let db: DatabaseSync | null = null;

function ensureDir() {
  if (!existsSync(dirname(DB_PATH))) {
    mkdirSync(dirname(DB_PATH), { recursive: true });
  }
}

function initDb() {
  if (db) return db;
  ensureDir();
  db = new DatabaseSync(DB_PATH);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      profile_id TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      item_code TEXT DEFAULT '',
      sku TEXT DEFAULT '',
      purchase_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      min_stock INTEGER DEFAULT 5,
      min_discount REAL DEFAULT 0,
      max_discount REAL DEFAULT 0,
      unit TEXT DEFAULT 'piece',
      category TEXT DEFAULT '',
      image_path TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS product_variants (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      item_code TEXT DEFAULT '',
      purchase_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0,
      stock INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      type TEXT DEFAULT 'retail',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    INSERT OR IGNORE INTO customers (id, name, type, is_active, created_at) 
    VALUES ('walkin-default', 'Walk-in Customer', 'walkin', 1, current_timestamp);

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      customer_id TEXT REFERENCES customers(id),
      subtotal REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      amount_paid REAL DEFAULT 0,
      payment_method TEXT DEFAULT 'cash',
      status TEXT DEFAULT 'paid',
      is_khata INTEGER DEFAULT 0,
      notes TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      variant_id TEXT REFERENCES product_variants(id),
      product_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      purchase_price REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_price REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deal_items (
      id TEXT PRIMARY KEY,
      deal_id TEXT NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
      product_id TEXT NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS khata_accounts (
      id TEXT PRIMARY KEY,
      customer_id TEXT NOT NULL UNIQUE REFERENCES customers(id),
      opening_balance REAL DEFAULT 0,
      current_balance REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS khata_transactions (
      id TEXT PRIMARY KEY,
      khata_account_id TEXT NOT NULL REFERENCES khata_accounts(id),
      order_id TEXT REFERENCES orders(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'general',
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS shop_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      shop_name TEXT DEFAULT '',
      shop_phone TEXT DEFAULT '',
      shop_address TEXT DEFAULT '',
      currency TEXT DEFAULT 'PKR',
      receipt_header TEXT DEFAULT '',
      receipt_footer TEXT DEFAULT '',
      thermal_printer TEXT DEFAULT '',
      tax_number TEXT DEFAULT '',
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT
    );
  `);

  const migrations = [
    `ALTER TABLE customers ADD COLUMN type TEXT DEFAULT 'retail'`,
    `ALTER TABLE products ADD COLUMN purchase_price REAL DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN min_discount REAL DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN max_discount REAL DEFAULT 0`,
    `ALTER TABLE products ADD COLUMN image_path TEXT DEFAULT ''`,
    `ALTER TABLE products ADD COLUMN updated_at TEXT`,
    `ALTER TABLE orders ADD COLUMN subtotal REAL DEFAULT 0`,
    `ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0`,
    `ALTER TABLE orders ADD COLUMN amount_paid REAL DEFAULT 0`,
    `ALTER TABLE orders ADD COLUMN notes TEXT DEFAULT ''`,
  ];

  for (const migration of migrations) {
    try {
      db.exec(migration);
    } catch {
      // Column already exists
    }
  }

  try {
    db.exec(`
      INSERT OR IGNORE INTO customers (id, name, phone, address, type, is_active, created_at)
      VALUES ('walkin-default', 'Walk-in Customer', '', '', 'walkin', 1, datetime('now'))
    `);
  } catch {}

  return db;
}

export function getDb() {
  return initDb();
}

export function transaction(fn: () => void) {
  const database = getDb();
  try {
    database.exec("BEGIN");
    fn();
    database.exec("COMMIT");
  } catch (err) {
    database.exec("ROLLBACK");
    throw err;
  }
}

function hashPassword(password: string) {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, encoded: string) {
  const [salt, storedHash] = encoded.split(":");
  const candidate = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(storedHash, "hex"), Buffer.from(candidate, "hex"));
}

export function upsertUser(profileId: string, email: string, password: string) {
  const database = getDb();
  const now = new Date().toISOString();
  if (profileId) {
    const oldUsers = database.prepare("SELECT id FROM users WHERE profile_id = ? AND email != ?").all(profileId, email) as { id: string }[];
    for (const u of oldUsers) {
      database.prepare("DELETE FROM sessions WHERE user_id = ?").run(u.id);
      database.prepare("DELETE FROM users WHERE id = ?").run(u.id);
    }
  }
  const existing = database.prepare("SELECT id FROM users WHERE email = ?").get(email) as { id: string } | undefined;
  const passwordHash = hashPassword(password);
  if (existing) {
    database.prepare("UPDATE users SET profile_id = ?, password_hash = ? WHERE id = ?").run(profileId, passwordHash, existing.id);
    return existing.id;
  }
  const id = randomUUID();
  database.prepare("INSERT INTO users (id, profile_id, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)").run(
    id,
    profileId,
    email,
    passwordHash,
    now
  );
  return id;
}

export function loginUser(email: string, password: string) {
  const database = getDb();
  const user = database
    .prepare("SELECT id, email, password_hash, profile_id FROM users WHERE email = ?")
    .get(email) as { id: string; email: string; password_hash: string; profile_id: string | null } | undefined;
  if (!user || !verifyPassword(password, user.password_hash)) return null;

  const sessionId = randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 30);
  database.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .run(sessionId, user.id, now.toISOString(), expires.toISOString());

  return { sessionId, user: { id: user.id, email: user.email, profileId: user.profile_id } };
}

export function getSession(sessionId: string) {
  const database = getDb();
  const row = database
    .prepare(
      `SELECT s.id as session_id, s.expires_at, u.id as user_id, u.email, u.profile_id
       FROM sessions s JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(sessionId) as
    | { session_id: string; expires_at: string; user_id: string; email: string; profile_id: string | null }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    database.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
    return null;
  }
  return { sessionId: row.session_id, user: { id: row.user_id, email: row.email, profileId: row.profile_id } };
}

export function deleteSession(sessionId: string) {
  const database = getDb();
  database.prepare("DELETE FROM sessions WHERE id = ?").run(sessionId);
}
