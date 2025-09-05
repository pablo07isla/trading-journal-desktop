-- Esquema inicial para la base de datos SQLite

-- Tabla de configuración del usuario
CREATE TABLE IF NOT EXISTS user_settings (
    id INTEGER PRIMARY KEY,
    timezone TEXT DEFAULT 'UTC',
    base_currency TEXT DEFAULT 'USD',
    theme TEXT DEFAULT 'light',
    language TEXT DEFAULT 'es',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de cuentas de trading
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

-- Tabla de estrategias
CREATE TABLE IF NOT EXISTS strategies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre VARCHAR(100) NOT NULL,        -- Nombre de la estrategia
    descripcion TEXT,                    -- Descripción detallada
    reglas TEXT,                         -- Reglas específicas de la estrategia
    estado VARCHAR(20) DEFAULT 'activa', -- Estado: activa, inactiva, etc.
    notas TEXT,                          -- Observaciones adicionales
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla principal de trades
CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    order_type TEXT NOT NULL CHECK (order_type IN ('BUY', 'SELL')),
    exit_price REAL,
    commissions REAL,
    entry_date DATETIME NOT NULL,
    exit_date DATETIME,
    strategy_id INTEGER,    cuenta_trading_id INTEGER,
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

-- Tabla de adjuntos
CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trade_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);
CREATE INDEX IF NOT EXISTS idx_trades_date ON trades(entry_date);
CREATE INDEX IF NOT EXISTS idx_trades_strategy ON trades(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(status);
CREATE INDEX IF NOT EXISTS idx_trades_cuenta ON trades(cuenta_trading_id);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_broker ON trading_accounts(broker);
CREATE INDEX IF NOT EXISTS idx_trading_accounts_estado ON trading_accounts(estado);
