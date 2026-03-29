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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(category, sub_category, target)
);
