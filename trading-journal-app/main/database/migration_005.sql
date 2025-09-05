-- Migración 005: Corregir tabla mt5_accounts para usar account_id como PRIMARY KEY
-- Este script maneja tanto tablas existentes como nuevas instalaciones

-- Verificar si la tabla mt5_accounts existe y tiene la estructura incorrecta
-- SQLite no permite cambiar PRIMARY KEY directamente, así que recreamos la tabla

BEGIN TRANSACTION;

-- Paso 1: Crear tabla temporal con la estructura correcta
CREATE TABLE IF NOT EXISTS mt5_accounts_new (
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

-- Paso 2: Migrar datos existentes si la tabla original existe
-- Verificamos si existe la tabla con estructura antigua (campo 'id' como PK)
INSERT OR IGNORE INTO mt5_accounts_new (
  account_id, account_name, company, currency, type, 
  initial_balance, current_balance, pnl, created_at
)
SELECT 
  account_id, account_name, company, currency, type,
  initial_balance, current_balance, pnl, created_at
FROM mt5_accounts 
WHERE EXISTS (
  SELECT 1 FROM sqlite_master 
  WHERE type='table' AND name='mt5_accounts'
);

-- Paso 3: Eliminar tabla original si existe
DROP TABLE IF EXISTS mt5_accounts;

-- Paso 4: Renombrar tabla nueva
ALTER TABLE mt5_accounts_new RENAME TO mt5_accounts;

-- Paso 5: Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_company ON mt5_accounts(company);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_currency ON mt5_accounts(currency);
CREATE INDEX IF NOT EXISTS idx_mt5_accounts_created_at ON mt5_accounts(created_at);

COMMIT;