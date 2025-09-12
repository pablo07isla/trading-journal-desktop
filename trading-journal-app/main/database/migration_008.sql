-- Migración 008: Agregar campos adicionales a mt5_trades para información del usuario
-- Agregar strategy_id, description, notes y campos relacionados con adjuntos

BEGIN TRANSACTION;

-- Agregar columnas para información adicional del usuario
ALTER TABLE mt5_trades ADD COLUMN strategy_id INTEGER REFERENCES strategies
(id) ON
DELETE
SET NULL;
ALTER TABLE mt5_trades ADD COLUMN description TEXT;
ALTER TABLE mt5_trades ADD COLUMN notes TEXT;

-- Crear tabla de adjuntos para trades MT5 (similar a la tabla existente para trades manuales)
CREATE TABLE
IF NOT EXISTS mt5_trade_attachments
(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mt5_trade_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(mt5_trade_id) REFERENCES mt5_trades
(trade_id) ON
DELETE CASCADE
);

-- Crear índices para optimizar consultas
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_strategy_id ON mt5_trades
(strategy_id);
CREATE INDEX
IF NOT EXISTS idx_mt5_trade_attachments_trade_id ON mt5_trade_attachments
(mt5_trade_id);

COMMIT;
