-- Eliminar tabla mt5_accounts si existe
DROP TABLE IF EXISTS mt5_accounts;
-- Migración: Crear tabla mt5_accounts


-- Migración: Crear tabla mt5_accounts (SQLite)
CREATE TABLE mt5_accounts (
  account_id INTEGER PRIMARY KEY,
  account_name TEXT,
  company TEXT,
  currency TEXT,
  type TEXT,
  initial_balance REAL,
  current_balance REAL,
  pnl REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Migración: Crear tabla mt5_trades (SQLite)
CREATE TABLE mt5_trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket INTEGER NOT NULL,
  order_id INTEGER,
  symbol TEXT,
  volume REAL,
  price REAL,
  commission REAL,
  swap REAL,
  profit REAL,
  time INTEGER,
  type INTEGER,
  comment TEXT,
  magic INTEGER
);
