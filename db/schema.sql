-- Personal Finance Dashboard - D1 Database Schema
-- Run with: wrangler d1 execute perfin-db --local --file=db/schema.sql

-- Placeholder: core tables will be added as features are built.

CREATE TABLE IF NOT EXISTS _migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS asset_record (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  target TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'Self',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, sub_category, target, owner)
);

-- Table to store archived transactions
CREATE TABLE IF NOT EXISTS transaction_record (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  -- Foreign Keys/Categorization
  owner TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT NOT NULL,
  target TEXT NOT NULL,
  -- CSV Data Fields (Mapping to 8 columns)
  transaction_date TEXT,
  account_date TEXT,
  info TEXT,
  withdraw REAL DEFAULT 0,
  deposit REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  transaction_info TEXT,
  remark TEXT,
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  -- Duplicate Prevention (Composite unique check)
  UNIQUE(owner, category, sub_category, target, transaction_date, account_date, info, withdraw, deposit, balance)
);
