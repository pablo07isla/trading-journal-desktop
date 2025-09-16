-- Migración 010: Reestructurar tabla de planes de trading
-- Simplificar y enfocar en la gestión de riesgo por operación

BEGIN TRANSACTION;

-- Agregar nuevos campos
ALTER TABLE trading_plans ADD COLUMN tipo_trader TEXT CHECK (tipo_trader IN ('Scalper', 'Intraday', 'Swing'));
ALTER TABLE trading_plans ADD COLUMN riesgo_max_diario_pct REAL;
ALTER TABLE trading_plans ADD COLUMN max_operaciones_dia INTEGER;
ALTER TABLE trading_plans ADD COLUMN riesgo_por_operacion_pct REAL;
ALTER TABLE trading_plans ADD COLUMN perdida_max_semanal_pct REAL;

-- Crear una tabla temporal con la nueva estructura
CREATE TABLE trading_plans_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT 1,
    
    -- Nuevo: Tipo de trader
    tipo_trader TEXT CHECK (tipo_trader IN ('Scalper', 'Intraday', 'Swing')),
    
    -- Gestión de riesgo simplificada (en porcentajes)
    riesgo_max_diario_pct REAL, -- Porcentaje de riesgo máximo diario
    max_operaciones_dia INTEGER, -- Número máximo de operaciones por día
    riesgo_por_operacion_pct REAL, -- Calculado: riesgo_max_diario_pct / max_operaciones_dia
    relacion_rr_minima REAL, -- Relación riesgo/beneficio mínima
    perdida_max_semanal_pct REAL, -- Porcentaje de pérdida máxima semanal
    
    -- Configuración de mercado (mantener)
    mercados_operacion TEXT, -- JSON: ["NY", "Asia", "London"]
    instrumentos_principales TEXT, -- JSON array de instrumentos
    horario_operacion_inicio TIME,
    horario_operacion_fin TIME,
    
    -- Psicología y disciplina (mantener)
    reglas_personales TEXT, -- JSON array de strings con reglas
    
    -- Estrategia asociada (mantener)
    strategy_id INTEGER,
    
    -- Metadatos
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL
);

-- Migrar datos existentes manteniendo solo los campos que se conservan
INSERT INTO trading_plans_new (
    id, 
    nombre, 
    activo, 
    relacion_rr_minima, 
    mercados_operacion, 
    instrumentos_principales, 
    horario_operacion_inicio, 
    horario_operacion_fin, 
    reglas_personales, 
    strategy_id, 
    created_at, 
    updated_at
)
SELECT 
    id, 
    nombre, 
    activo, 
    relacion_rr_minima, 
    mercados_operacion, 
    instrumentos_principales, 
    horario_operacion_inicio, 
    horario_operacion_fin, 
    reglas_personales, 
    strategy_id, 
    created_at, 
    updated_at
FROM trading_plans;

-- Eliminar tabla anterior y renombrar la nueva
DROP TABLE trading_plans;
ALTER TABLE trading_plans_new RENAME TO trading_plans;

-- Recrear índices
CREATE INDEX IF NOT EXISTS idx_trading_plans_activo ON trading_plans(activo);
CREATE INDEX IF NOT EXISTS idx_trading_plans_strategy_id ON trading_plans(strategy_id);
CREATE INDEX IF NOT EXISTS idx_trading_plans_tipo_trader ON trading_plans(tipo_trader);

COMMIT;