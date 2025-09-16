-- Migración 009: Crear tabla de planes de trading
-- Tabla para almacenar planes de trading con objetivos, riesgo, mercados y reglas

BEGIN TRANSACTION;

-- Crear tabla principal de planes de trading
CREATE TABLE IF NOT EXISTS trading_plans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    
    -- Fechas
    fecha_inicio DATE,
    fecha_fin DATE,
    proposito_principal TEXT,
    
    -- Objetivos financieros
    meta_anual REAL,
    meta_mensual REAL,
    meta_semanal REAL,
    
    -- Capital y gestión de riesgo
    capital_disponible REAL NOT NULL,
    riesgo_max_operacion REAL NOT NULL, -- Porcentaje (ej: 2.5 para 2.5%)
    perdida_max_diaria REAL,
    perdida_max_semanal REAL,
    perdida_max_mensual REAL,
    relacion_rr_minima REAL, -- Relación riesgo/beneficio mínima (ej: 1.5)
    
    -- Configuración de mercado
    mercados_operacion TEXT, -- JSON: ["NY", "Asia", "London"]
    instrumentos_principales TEXT, -- JSON array de instrumentos
    horario_operacion_inicio TIME,
    horario_operacion_fin TIME,
    
    -- Psicología y disciplina
    reglas_personales TEXT, -- JSON array de strings con reglas
    
    -- Estrategia asociada
    strategy_id INTEGER,
    
    -- Metadatos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
);

-- Crear tabla para seguimiento de progreso del plan
CREATE TABLE IF NOT EXISTS plan_performance_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    plan_id INTEGER NOT NULL,
    fecha DATE NOT NULL,
    profit_acumulado REAL DEFAULT 0,
    trades_ejecutados INTEGER DEFAULT 0,
    reglas_cumplidas BOOLEAN DEFAULT 1,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (plan_id) REFERENCES trading_plans(id) ON DELETE CASCADE,
    UNIQUE(plan_id, fecha) -- Un registro por plan por día
);

-- Agregar campo plan_id a la tabla mt5_trades para vincular trades con planes
ALTER TABLE mt5_trades ADD COLUMN plan_id INTEGER REFERENCES trading_plans(id) ON DELETE SET NULL;

-- Agregar campo plan_id a la tabla trades manuales también
ALTER TABLE trades ADD COLUMN plan_id INTEGER REFERENCES trading_plans(id) ON DELETE SET NULL;

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_trading_plans_activo ON trading_plans(activo);
CREATE INDEX IF NOT EXISTS idx_trading_plans_strategy_id ON trading_plans(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trading_plans_fechas ON trading_plans(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_plan_performance_plan_id ON plan_performance_tracking(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_performance_fecha ON plan_performance_tracking(fecha);
CREATE INDEX IF NOT EXISTS idx_mt5_trades_plan_id ON mt5_trades(plan_id);
CREATE INDEX IF NOT EXISTS idx_trades_plan_id ON trades(plan_id);

COMMIT;