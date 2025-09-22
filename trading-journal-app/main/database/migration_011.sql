-- Migración 011: Agregar campos de gestión de riesgo a mt5_accounts
-- Agregar profit_target_percent, stop_target_percent, daily_loss_percent

BEGIN TRANSACTION;

-- Agregar nuevas columnas para gestión de riesgo
ALTER TABLE mt5_accounts ADD profit_target_percent REAL DEFAULT 0.0;
ALTER TABLE mt5_accounts ADD stop_target_percent REAL DEFAULT 0.0;
ALTER TABLE mt5_accounts ADD daily_loss_percent REAL DEFAULT 0.0;

COMMIT;