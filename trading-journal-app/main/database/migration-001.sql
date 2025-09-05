-- Migration 001: Remove quantity and entry_price columns, add result column
-- This migration updates the trades table to remove quantity and entry_price fields
-- and adds the result field for tracking SL/TP/BE outcomes

-- SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
-- First, create a new table with the updated schema
CREATE TABLE IF NOT EXISTS trades_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    exit_price REAL,
    commissions REAL,
    entry_date DATETIME NOT NULL,
    exit_date DATETIME,
    strategy_id INTEGER,
    market_type TEXT,
    confidence TEXT,
    description TEXT,
    notes TEXT,
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    pnl REAL,
    result TEXT CHECK (result IN ('SL', 'TP', 'BE')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
);

-- Copy data from old table to new table (excluding quantity and entry_price)
INSERT INTO trades_new (
    id, symbol, order_type, exit_price, commissions, entry_date, exit_date, 
    strategy_id, market_type, confidence, description, notes, status, pnl, 
    created_at, updated_at
)
SELECT 
    id, symbol, order_type, exit_price, commissions, entry_date, exit_date,
    strategy_id, market_type, confidence, description, notes, status, pnl,
    created_at, updated_at
FROM trades;

-- Drop the old table
DROP TABLE trades;

-- Rename the new table to the original name
ALTER TABLE trades_new RENAME TO trades;
