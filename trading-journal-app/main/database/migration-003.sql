-- Migration 003: Update strategies table with new fields

-- Create new strategies table with the required fields
CREATE TABLE IF NOT EXISTS strategies_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,        -- Nombre de la estrategia
    descripcion TEXT,                    -- Descripción detallada
    reglas TEXT,                         -- Reglas específicas de la estrategia
    estado VARCHAR(20) DEFAULT 'activa', -- Estado: activa, inactiva, etc.
    notas TEXT,                          -- Observaciones adicionales
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Migrate data from old strategies table to new one
INSERT INTO strategies_new (id, nombre, created_at, updated_at)
SELECT id, name as nombre, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM strategies;

-- Drop old table
DROP TABLE strategies;

-- Rename new table
ALTER TABLE strategies_new RENAME TO strategies;

-- Update the foreign key reference by recreating trades table
-- First create backup of trades
CREATE TABLE trades_backup AS SELECT * FROM trades;

-- Drop trades table
DROP TABLE trades;

-- Recreate trades table with updated foreign key reference
CREATE TABLE trades (
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

-- Restore trades data
INSERT INTO trades SELECT * FROM trades_backup;

-- Drop backup table
DROP TABLE trades_backup;

-- Recreate indices
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_cuenta ON trades(cuenta_trading_id);

-- Create indices for strategies
CREATE INDEX IF NOT EXISTS idx_strategies_nombre ON strategies(nombre);
CREATE INDEX IF NOT EXISTS idx_strategies_estado ON strategies(estado);
