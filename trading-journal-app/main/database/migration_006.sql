-- Migración 006: Reestructurar tabla mt5_trades con nueva estructura
-- Cambiar de estructura antigua a nueva estructura optimizada para trading

BEGIN TRANSACTION;

-- Paso 1: Crear nueva tabla con estructura correcta
CREATE TABLE
IF NOT EXISTS mt5_trades_new
(
    trade_id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER,
    position_id BIGINT,
    symbol VARCHAR
(20),
    trade_type VARCHAR
(10), -- 'BUY' o 'SELL'
    volume DECIMAL
(10,2),
    open_time TIMESTAMP,
    open_price DECIMAL
(15,5),
    close_time TIMESTAMP,
    close_price DECIMAL
(15,5),
    profit DECIMAL
(15,2),
    commission DECIMAL
(15,2),
    swap DECIMAL
(15,2),
    magic_number BIGINT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY
(account_id) REFERENCES mt5_accounts
(account_id),
    UNIQUE
(account_id, position_id) -- Evitar duplicados por cuenta y posición
);

-- Paso 2: Migrar datos existentes si la tabla original existe
-- Mapear campos antiguos a nuevos cuando sea posible
INSERT OR
IGNORE INTO mt5_trades_new (
    account_id,
    position_id,
    symbol,
    trade_type,
    volume,
    open_price,
    profit,
    commission,
    swap,
    magic_number,
    comment,
    open_time
)
SELECT
    NULL as account_id, -- Se asignará posteriormente
    ticket as position_id, -- ticket se mapea a position_id
    symbol,
    CASE 
        WHEN type = 0 THEN 'BUY'
        WHEN type = 1 THEN 'SELL'
        ELSE 'UNKNOWN'
    END as trade_type,
    volume,
    price as open_price,
    profit,
    commission,
    swap,
    magic as magic_number,
    comment,
    datetime(time, 'unixepoch') as open_time
FROM mt5_trades
WHERE EXISTS (
    SELECT 1
FROM sqlite_master
WHERE type='table' AND name='mt5_trades'
);

-- Paso 3: Eliminar tabla original si existe
DROP TABLE IF EXISTS mt5_trades;

-- Paso 4: Renombrar tabla nueva
ALTER TABLE mt5_trades_new RENAME TO mt5_trades;

-- Paso 5: Crear índices para optimizar consultas
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_account_id ON mt5_trades
(account_id);
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_position_id ON mt5_trades
(position_id);
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_symbol ON mt5_trades
(symbol);
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_trade_type ON mt5_trades
(trade_type);
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_open_time ON mt5_trades
(open_time);
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_close_time ON mt5_trades
(close_time);
CREATE INDEX
IF NOT EXISTS idx_mt5_trades_magic_number ON mt5_trades
(magic_number);

-- Paso 6: Crear vista para compatibilidad con consultas existentes (opcional)
CREATE VIEW
IF NOT EXISTS mt5_trades_legacy AS
SELECT
    trade_id as id,
    position_id as ticket,
    position_id as order_id,
    symbol,
    volume,
    open_price as price,
    commission,
    swap,
    profit,
    strftime('%s', open_time) as time,
    CASE 
        WHEN trade_type = 'BUY' THEN 0
        WHEN trade_type = 'SELL' THEN 1
        ELSE -1
    END as type,
    comment,
    magic_number as magic
FROM mt5_trades;

COMMIT;