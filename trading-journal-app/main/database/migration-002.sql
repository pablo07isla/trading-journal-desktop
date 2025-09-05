-- Migration 002: Add trading accounts table and update trades table
-- This migration adds the trading_accounts table and updates trades to reference it

-- Create the trading accounts table
CREATE TABLE IF NOT EXISTS trading_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    broker TEXT NOT NULL,
    tipo_cuenta TEXT NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'USD',
    balance_inicial REAL,
    fecha_apertura DATE,
    estado TEXT NOT NULL DEFAULT 'activa',
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Check if trades table already has cuenta_trading_id column
-- If not, we need to recreate the table to add it
CREATE TABLE IF NOT EXISTS trades_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    exit_price REAL,
    commissions REAL,
    entry_date DATETIME NOT NULL,
    exit_date DATETIME,
    strategy_id INTEGER,
    cuenta_trading_id INTEGER,
    market_type TEXT,
    confidence TEXT,
    description TEXT,
    notes TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    pnl REAL,
    result TEXT CHECK (result IN ('SL', 'TP', 'BE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL,
    FOREIGN KEY (cuenta_trading_id) REFERENCES trading_accounts(id) ON DELETE SET NULL
);

-- Copy data from old table to new table
INSERT INTO trades_new (
    id, symbol, order_type, exit_price, commissions, entry_date, exit_date, 
    strategy_id, market_type, confidence, description, notes, status, pnl, 
    result, created_at, updated_at
)
SELECT 
    id, symbol, order_type, exit_price, commissions, entry_date, exit_date,
    strategy_id, market_type, confidence, description, notes, status, pnl,
    result, created_at, updated_at
FROM trades;

-- Drop the old table
DROP TABLE trades;

-- Rename the new table to the original name
ALTER TABLE trades_new RENAME TO trades;

-- Create indices for optimization
CREATE INDEX IF NOT EXISTS idx_trades_cuenta ON trades(cuenta_trading_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_broker ON trading_accounts(broker);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_estado ON trading_accounts(estado);
