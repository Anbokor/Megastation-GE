import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema.ts';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.resolve(dataDir, 'megastation.db');
export const sqliteDb = new Database(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
sqliteDb.pragma('journal_mode = WAL');
sqliteDb.pragma('foreign_keys = ON');

export const db = drizzle(sqliteDb, { schema });

// Auto-initialize tables if not created
export function initDatabase() {
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'customer',
      branch_id TEXT,
      phone TEXT,
      dni TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      address TEXT NOT NULL,
      neighborhood TEXT NOT NULL,
      city TEXT NOT NULL,
      phone TEXT NOT NULL,
      whatsapp TEXT NOT NULL,
      hours TEXT NOT NULL,
      is_pickup_available INTEGER NOT NULL DEFAULT 1,
      type TEXT NOT NULL DEFAULT 'store'
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      brand TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL,
      cost_price INTEGER NOT NULL,
      margin_percent INTEGER NOT NULL DEFAULT 35,
      image TEXT NOT NULL,
      barcode TEXT NOT NULL UNIQUE,
      specs_json TEXT NOT NULL DEFAULT '{}',
      featured INTEGER NOT NULL DEFAULT 0,
      rating REAL NOT NULL DEFAULT 5.0,
      reviews_count INTEGER NOT NULL DEFAULT 0,
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS branch_stock (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      UNIQUE(branch_id, product_id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      tracking_number TEXT NOT NULL UNIQUE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_dni TEXT NOT NULL,
      customer_address_json TEXT,
      delivery_method TEXT NOT NULL,
      branch_id TEXT,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      order_status TEXT NOT NULL DEFAULT 'pendiente',
      subtotal INTEGER NOT NULL,
      discount INTEGER NOT NULL DEFAULT 0,
      shipping_cost INTEGER NOT NULL DEFAULT 0,
      total INTEGER NOT NULL,
      status_history_json TEXT NOT NULL DEFAULT '[]',
      has_backorder INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      brand TEXT NOT NULL,
      price INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      barcode TEXT NOT NULL,
      is_backorder INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      from_branch TEXT,
      to_branch TEXT,
      quantity INTEGER NOT NULL,
      cost_price INTEGER,
      final_price INTEGER,
      note TEXT,
      created_at TEXT NOT NULL
    );
  `);

  // Safe runtime migrations for existing databases
  try {
    sqliteDb.exec(`ALTER TABLE orders ADD COLUMN has_backorder INTEGER NOT NULL DEFAULT 0;`);
  } catch {}
  try {
    sqliteDb.exec(`ALTER TABLE order_items ADD COLUMN is_backorder INTEGER NOT NULL DEFAULT 0;`);
  } catch {}
}
