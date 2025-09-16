import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import { app } from "electron";

export interface TradeData {
  symbol: string;
  orderType: "BUY" | "SELL";
  exitPrice?: number;
  commissions?: number;
  entryDate: string;
  exitDate?: string;
  strategyId?: number;
  cuentaTradingId?: number;
  marketType?: string;
  confidence?: string;
  description?: string;
  notes?: string;
  status?: "OPEN" | "CLOSED";
  pnl?: number;
  result?: "SL" | "TP" | "BE";
}

export interface TradingAccountData {
  id?: number;
  nombre: string;
  broker: string;
  tipoCuenta: string;
  moneda: string;
  balanceInicial?: number;
  fechaApertura?: string;
  estado: string;
  notas?: string;
}

export interface StrategyData {
  id?: number;
  nombre: string;
  descripcion?: string;
  reglas?: string;
  estado: string;
  notas?: string;
}

// Interfaces actualizadas para MT5 Trades - Agregar al archivo db-manager.ts

export interface MT5TradeData {
  trade_id?: number;
  account_id: number;
  position_id: bigint;
  symbol: string;
  trade_type: "BUY" | "SELL";
  volume: number;
  open_time: string; // ISO timestamp
  open_price: number;
  close_time?: string; // ISO timestamp, opcional para trades abiertos
  close_price?: number;
  profit: number;
  commission: number;
  swap: number;
  magic_number?: bigint;
  comment?: string;
  // Campos adicionales del usuario
  strategy_id?: number;
  description?: string;
  notes?: string;
}

export interface MT5TradeDataLegacy {
  ticket: number;
  order_id?: number;
  symbol: string;
  volume: number;
  price: number;
  commission: number;
  swap: number;
  profit: number;
  time: number; // Unix timestamp
  type: number; // 0 = BUY, 1 = SELL
  comment?: string;
  magic?: number;
}

export interface MT5AccountData {
  account_id: number;
  account_name?: string;
  company?: string;
  currency?: string;
  type?: string;
  initial_balance: number;
  current_balance: number;
  pnl: number;
}

// Tipo para compatibilidad con datos legacy
export interface MT5TradeInsertData {
  account_id: number;
  // entry: number;
  position_id: string | number;
  symbol: string;
  trade_type: "BUY" | "SELL";
  volume: number;
  open_time: string;
  open_price: number;
  close_time?: string;
  close_price?: number;
  profit: number;
  commission: number;
  swap: number;
  magic_number?: string | number;
  comment?: string;
}

export interface MT5TradeAttachment {
  id: number;
  mt5_trade_id: number;
  filePath: string;
  fileType: string;
  created_at: string;
}

// Interface para planes de trading
export interface TradingPlanData {
  id?: number;
  nombre: string;
  activo: boolean;

  // Información general
  tipo_trader?: "Scalper" | "Intraday" | "Swing";

  // Capital y gestión de riesgo (en porcentajes)
  riesgo_max_diario_pct?: number; // Porcentaje de riesgo máximo diario
  max_operaciones_dia?: number; // Número máximo de operaciones por día
  riesgo_por_operacion_pct?: number; // Calculado: riesgo_max_diario_pct / max_operaciones_dia
  relacion_rr_minima?: number; // Relación riesgo/beneficio mínima
  perdida_max_semanal_pct?: number; // Porcentaje de pérdida máxima semanal

  // Configuración de mercado (JSON strings)
  mercados_operacion?: string; // JSON: ["NY", "Asia", "London"]
  instrumentos_principales?: string; // JSON array
  horario_operacion_inicio?: string;
  horario_operacion_fin?: string;

  // Psicología y disciplina
  reglas_personales?: string; // JSON array de strings

  // Estrategia asociada
  strategy_id?: number;

  // Metadatos
  created_at?: string;
  updated_at?: string;
}

export interface PlanPerformanceData {
  id?: number;
  plan_id: number;
  fecha: string;
  profit_acumulado: number;
  trades_ejecutados: number;
  reglas_cumplidas: boolean;
  notas?: string;
  created_at?: string;
}

export class DatabaseManager {
  // Consulta todas las cuentas MT5
  getMT5Accounts(): any[] {
    console.log("DatabaseManager.getMT5Accounts: Ejecutando consulta...");

    try {
      const stmt = this.db.prepare(`
      SELECT 
        account_id,
        account_name,
        company,
        currency,
        type,
        initial_balance,
        current_balance,
        pnl,
        created_at
      FROM mt5_accounts 
      ORDER BY created_at DESC
    `);

      const results = stmt.all();
      console.log(
        "DatabaseManager.getMT5Accounts: Resultados:",
        results.length,
        results
      );

      // Log adicional para verificar fechas
      results.forEach((account: any, index) => {
        console.log(`Cuenta ${index + 1}:`, {
          account_id: account.account_id,
          account_name: account.account_name,
          created_at: account.created_at,
          created_at_type: typeof account.created_at,
        });
      });

      return results;
    } catch (error) {
      console.error("Error consultando cuentas MT5:", error);
      return [];
    }
  }

  addMT5Account(account: {
    login: number;
    name: string;
    company: string;
    currency: string;
    type?: string;
    initial_balance: number;
    current_balance: number;
    pnl: number;
    created_at?: string;
  }) {
    console.log("addMT5Account: Insertando cuenta:", account);

    // Usar INSERT OR REPLACE para manejar actualizaciones de cuentas existentes
    const stmt = this.db.prepare(`
    INSERT OR REPLACE INTO mt5_accounts (
      account_id, account_name, company, currency, type, 
      initial_balance, current_balance, pnl, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

    try {
      const result = stmt.run(
        account.login, // account_id (PK)
        account.name, // account_name
        account.company, // company
        account.currency, // currency
        account.type ?? null, // type
        account.initial_balance,
        account.current_balance,
        account.pnl,
        account.created_at ?? null // created_at
      );

      console.log("addMT5Account: Resultado de inserción:", result);
      return result;
    } catch (error) {
      console.error("Error insertando cuenta MT5:", error);
      throw error;
    }
  }

  // Método para actualizar una cuenta MT5
  updateMT5Account(accountId: number, updateData: Partial<MT5AccountData>) {
    console.log(
      "updateMT5Account: Actualizando cuenta:",
      accountId,
      updateData
    );

    const updates: string[] = [];
    const params: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (key !== "account_id" && value !== undefined) {
        updates.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      throw new Error("No hay datos para actualizar");
    }

    const query = `
      UPDATE mt5_accounts 
      SET ${updates.join(", ")}
      WHERE account_id = ?
    `;

    params.push(accountId);

    const stmt = this.db.prepare(query);

    try {
      const result = stmt.run(...params);
      console.log("updateMT5Account: Resultado de actualización:", result);

      if (result.changes === 0) {
        throw new Error("No se encontró la cuenta para actualizar");
      }

      return result;
    } catch (error) {
      console.error("Error actualizando cuenta MT5:", error);
      throw error;
    }
  }

  // Método actualizado para insertar trades MT5
  addMT5Trade(trade: MT5TradeInsertData) {
    console.log("addMT5Trade: Insertando trade:", trade);

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO mt5_trades (
        account_id, position_id, symbol, trade_type, volume,
        open_time, open_price, close_time, close_price,
        profit, commission, swap, magic_number, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        trade.account_id,
        trade.position_id.toString(),
        trade.symbol,
        trade.trade_type,
        trade.volume,
        trade.open_time,
        trade.open_price,
        trade.close_time ?? null,
        trade.close_price ?? null,
        trade.profit,
        trade.commission,
        trade.swap,
        trade.magic_number?.toString() ?? null,
        trade.comment ?? null
      );

      console.log("addMT5Trade: Resultado de inserción:", result);
      return result;
    } catch (error) {
      console.error("Error insertando trade MT5:", error);
      throw error;
    }
  }

  // Método para obtener trades MT5
  getMT5Trades(accountId?: number): MT5TradeData[] {
    console.log("DatabaseManager.getMT5Trades: Consultando trades...");

    let query = `
      SELECT 
        trade_id,
        account_id,
        position_id,
        symbol,
        trade_type,
        volume,
        open_time,
        open_price,
        close_time,
        close_price,
        profit,
        commission,
        swap,
        magic_number,
        comment,
        strategy_id,
        description,
        notes,
        created_at
      FROM mt5_trades
    `;

    const params: any[] = [];

    if (accountId) {
      query += ` WHERE account_id = ?`;
      params.push(accountId);
    }

    query += ` ORDER BY open_time DESC`;

    try {
      const stmt = this.db.prepare(query);
      const results = stmt.all(...params) as MT5TradeData[];

      console.log("DatabaseManager.getMT5Trades: Resultados:", results.length);
      return results;
    } catch (error) {
      console.error("Error consultando trades MT5:", error);
      return [];
    }
  }

  // Método para obtener trades MT5 por símbolo
  getMT5TradesBySymbol(symbol: string, accountId?: number): MT5TradeData[] {
    let query = `
      SELECT 
        trade_id,
        account_id,
        position_id,
        symbol,
        trade_type,
        volume,
        open_time,
        open_price,
        close_time,
        close_price,
        profit,
        commission,
        swap,
        magic_number,
        comment
      FROM mt5_trades
      WHERE symbol = ?
    `;

    const params: any[] = [symbol];

    if (accountId) {
      query += ` AND account_id = ?`;
      params.push(accountId);
    }

    query += ` ORDER BY open_time DESC`;

    try {
      const stmt = this.db.prepare(query);
      return stmt.all(...params) as MT5TradeData[];
    } catch (error) {
      console.error("Error consultando trades por símbolo:", error);
      return [];
    }
  }

  // Método para eliminar trade
  deleteMT5Trade(tradeId: number) {
    const stmt = this.db.prepare(`DELETE FROM mt5_trades WHERE trade_id = ?`);
    return stmt.run(tradeId);
  }

  // Método para borrar todos los trades MT5
  clearAllMT5Trades() {
    console.log("clearAllMT5Trades: Borrando todos los trades MT5...");
    const stmt = this.db.prepare(`DELETE FROM mt5_trades`);
    const result = stmt.run();
    console.log(`clearAllMT5Trades: ${result.changes} trades eliminados`);
    return result;
  }

  // Método para obtener estadísticas por cuenta
  getMT5AccountStats(accountId: number) {
    const stmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_trades,
        SUM(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as winning_trades,
        SUM(CASE WHEN profit < 0 THEN 1 ELSE 0 END) as losing_trades,
        SUM(profit) as total_profit,
        SUM(commission) as total_commission,
        SUM(swap) as total_swap,
        AVG(profit) as avg_profit,
        MAX(profit) as max_profit,
        MIN(profit) as min_profit
      FROM mt5_trades 
      WHERE account_id = ?
    `);

    return stmt.get(accountId);
  }

  private db: Database.Database;

  constructor() {
    const userDataPath = app.getPath("userData");
    const dbPath = path.join(userDataPath, "trading_journal.db");
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
    }
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }
  private initializeDatabase() {
    // Ejecutar migraciones principales (trades, accounts, strategies)
    const tables = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='trades'"
      )
      .all();

    if (tables.length > 0) {
      // ...existing code...
      // (sin cambios en esta parte)
    } else {
      // ...existing code...
    }

    // Ejecutar migración 005: Corregir estructura de mt5_accounts
    try {
      console.log("Verificando estructura de tabla mt5_accounts...");

      // Verificar si necesitamos ejecutar la migración 005
      const needsMigration005 = this.checkIfNeedsMT5Migration();

      if (needsMigration005) {
        console.log("Ejecutando migración 005: Corrigiendo mt5_accounts...");

        // Intentar cargar migration-005.sql
        const migration005Path = path.join(__dirname, "migration-005.sql");
        if (fs.existsSync(migration005Path)) {
          const migration005 = fs.readFileSync(migration005Path, "utf8");
          this.db.exec(migration005);
          console.log("Migration 005 (MT5 fix) aplicada desde archivo.");
        } else {
          // Fallback: ejecutar migración inline
          this.runMT5Migration005Inline();
          console.log("Migration 005 (MT5 fix) aplicada inline.");
        }
      }

      // Si no existe ninguna tabla MT5, crear con estructura correcta
      const mt5AccountsExists = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='mt5_accounts'"
        )
        .get();

      if (!mt5AccountsExists) {
        console.log("Creando tablas MT5 con estructura correcta...");
        this.createMT5TablesInline();
      }
    } catch (error) {
      console.error("Error en migración MT5:", error);
    }

    try {
      console.log("Verificando estructura de tabla mt5_trades...");

      const needsMigration006 = this.checkIfNeedsMT5TradesMigration();

      if (needsMigration006) {
        console.log("Ejecutando migración 006: Reestructurando mt5_trades...");

        const migration006Path = path.join(__dirname, "migration-006.sql");
        if (fs.existsSync(migration006Path)) {
          const migration006 = fs.readFileSync(migration006Path, "utf8");
          this.db.exec(migration006);
          console.log(
            "Migration 006 (MT5 trades restructure) aplicada desde archivo."
          );
        } else {
          this.runMT5TradesMigration006Inline();
          console.log(
            "Migration 006 (MT5 trades restructure) aplicada inline."
          );
        }
      }
    } catch (error) {
      console.error("Error en migración 006:", error);
    }

    // Always check if we need to run migration 002 (add trading accounts)
    // This handles both existing and new databases
    const tradingAccountsTable = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='trading_accounts'"
      )
      .all();

    if (tradingAccountsTable.length === 0) {
      console.log("Running migration 002: Adding trading accounts...");
      try {
        // Create trading accounts table
        this.db.exec(`
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
        `);

        // Add cuenta_trading_id column to trades table if it doesn't exist
        const tradesColumns = this.db
          .prepare("PRAGMA table_info(trades)")
          .all() as {
          name: string;
        }[];
        const hasCuentaTradingId = tradesColumns.some(
          (col) => col.name === "cuenta_trading_id"
        );

        if (!hasCuentaTradingId) {
          console.log("Adding cuenta_trading_id column to trades table...");
          this.db.exec(`
            ALTER TABLE trades ADD COLUMN cuenta_trading_id INTEGER 
            REFERENCES trading_accounts(id) ON DELETE SET NULL;
          `);
        }

        // Create indices
        this.db.exec(`
          CREATE INDEX IF NOT EXISTS idx_trades_cuenta ON trades(cuenta_trading_id);
          CREATE INDEX IF NOT EXISTS idx_trading_accounts_broker ON trading_accounts(broker);
          CREATE INDEX IF NOT EXISTS idx_trading_accounts_estado ON trading_accounts(estado);
        `);

        console.log("Migration 002 completed");
      } catch (error) {
        console.error("Migration 002 failed:", error);
      }
    } else {
      // Even if trading_accounts table exists, check if cuenta_trading_id column exists in trades
      const tradesColumns = this.db
        .prepare("PRAGMA table_info(trades)")
        .all() as { name: string }[];
      const hasCuentaTradingId = tradesColumns.some(
        (col) => col.name === "cuenta_trading_id"
      );

      if (!hasCuentaTradingId) {
        console.log(
          "Adding missing cuenta_trading_id column to trades table..."
        );
        try {
          this.db.exec(`
            ALTER TABLE trades ADD COLUMN cuenta_trading_id INTEGER 
            REFERENCES trading_accounts(id) ON DELETE SET NULL;
          `);
          console.log("cuenta_trading_id column added successfully");
        } catch (error) {
          console.error("Failed to add cuenta_trading_id column:", error);
        }
      }
    }

    // Check if we need to run migration 003 (update strategies table)
    const strategiesColumns = this.db
      .prepare("PRAGMA table_info(strategies)")
      .all() as { name: string }[];

    const hasNombreColumn = strategiesColumns.some(
      (col) => col.name === "nombre"
    );

    if (!hasNombreColumn) {
      console.log("Running migration 003: Updating strategies table...");
      try {
        const migration003Path = path.join(__dirname, "migration-003.sql");
        if (fs.existsSync(migration003Path)) {
          const migration = fs.readFileSync(migration003Path, "utf8");
          this.db.exec(migration);
          console.log("Migration 003 completed");
        } else {
          // Fallback: run migration inline
          this.runStrategiesMigration();
          console.log("Strategies migration completed inline");
        }
      } catch (error) {
        console.error("Migration 003 failed:", error);
        // Try inline migration as fallback
        console.log("Attempting inline strategies migration as fallback...");
        this.runStrategiesMigration();
      }
    }

    // Insert default strategies if they don't exist
    const defaultStrategies = [
      {
        id: 1,
        nombre: "Breakout",
        descripcion: "Estrategia de ruptura de niveles clave",
        estado: "activa",
      },
      {
        id: 2,
        nombre: "Reversión",
        descripcion: "Estrategia de reversión en soportes y resistencias",
        estado: "activa",
      },
      {
        id: 3,
        nombre: "Pullback",
        descripcion: "Estrategia de retroceso en tendencia",
        estado: "activa",
      },
    ];
    for (const s of defaultStrategies) {
      this.db
        .prepare(
          "INSERT OR IGNORE INTO strategies (id, nombre, descripcion, estado) VALUES (?, ?, ?, ?)"
        )
        .run(s.id, s.nombre, s.descripcion, s.estado);
    }

    // Ejecutar migración 008: Agregar campos adicionales para MT5 trades
    try {
      console.log(
        "Verificando si se necesita migración 008 (campos adicionales MT5)..."
      );
      const needsMigration008 = this.checkIfNeedsMT5FieldsMigration();

      if (needsMigration008) {
        console.log("Aplicando migración 008...");
        const migration008Path = path.join(__dirname, "migration_008.sql");
        if (fs.existsSync(migration008Path)) {
          const migration008 = fs.readFileSync(migration008Path, "utf8");
          this.db.exec(migration008);
          console.log(
            "Migration 008 (campos adicionales MT5) aplicada desde archivo."
          );
        } else {
          this.runMT5FieldsMigration008Inline();
          console.log(
            "Migration 008 (campos adicionales MT5) aplicada inline."
          );
        }
      }
    } catch (error) {
      console.error("Error en migración 008:", error);
    }

    // Ejecutar migración 009: Crear tabla de planes de trading
    try {
      console.log(
        "Verificando si se necesita migración 009 (planes de trading)..."
      );
      const needsMigration009 = this.checkIfNeedsTradingPlansMigration();

      if (needsMigration009) {
        console.log("Aplicando migración 009...");
        const migration009Path = path.join(__dirname, "migration_009.sql");
        if (fs.existsSync(migration009Path)) {
          const migration009 = fs.readFileSync(migration009Path, "utf8");
          this.db.exec(migration009);
          console.log(
            "Migration 009 (planes de trading) aplicada desde archivo."
          );
        } else {
          this.runTradingPlansMigration009Inline();
          console.log("Migration 009 (planes de trading) aplicada inline.");
        }
      }
    } catch (error) {
      console.error("Error en migración 009:", error);
    }

    // Ejecutar migración 010: Reestructurar planes de trading
    try {
      console.log(
        "Verificando si se necesita migración 010 (reestructurar planes de trading)..."
      );
      const needsMigration010 =
        this.checkIfNeedsTradingPlansRestructureMigration();

      if (needsMigration010) {
        console.log("Aplicando migración 010...");
        const migration010Path = path.join(__dirname, "migration_010.sql");
        if (fs.existsSync(migration010Path)) {
          const migration010 = fs.readFileSync(migration010Path, "utf8");
          this.db.exec(migration010);
          console.log(
            "Migration 010 (reestructurar planes de trading) aplicada desde archivo."
          );
        } else {
          this.runTradingPlansRestructureMigration010Inline();
          console.log(
            "Migration 010 (reestructurar planes de trading) aplicada inline."
          );
        }
      }
    } catch (error) {
      console.error("Error en migración 010:", error);
    }
  }

  private runInlineMigration() {
    // Inline migration SQL
    const migrationSQL = `
      -- Create new table with updated schema
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
    `;
    this.db.exec(migrationSQL);
  }

  private runStrategiesMigration() {
    // Inline migration for strategies table
    const migrationSQL = `
      -- Create new strategies table with updated schema
      CREATE TABLE IF NOT EXISTS strategies_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT,
          reglas TEXT,
          estado VARCHAR(20) DEFAULT 'activa',
          notas TEXT,
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

      -- Create indices for strategies
      CREATE INDEX IF NOT EXISTS idx_strategies_nombre ON strategies(nombre);
      CREATE INDEX IF NOT EXISTS idx_strategies_estado ON strategies(estado);
    `;

    this.db.exec(migrationSQL);
  }

  private createInlineSchema() {
    const schemaSQL = `
      -- Tabla de configuración del usuario
      CREATE TABLE IF NOT EXISTS user_settings (
          id INTEGER PRIMARY KEY,
          timezone TEXT DEFAULT 'UTC',
          base_currency TEXT DEFAULT 'USD',
          theme TEXT DEFAULT 'light',
          language TEXT DEFAULT 'es',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );      -- Tabla de estrategias
      CREATE TABLE IF NOT EXISTS strategies (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre VARCHAR(100) NOT NULL,
          descripcion TEXT,
          reglas TEXT,
          estado VARCHAR(20) DEFAULT 'activa',
          notas TEXT,
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

      -- Tabla de adjuntos
      CREATE TABLE IF NOT EXISTS attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          trade_id INTEGER NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT,
          FOREIGN KEY (trade_id) REFERENCES trades(id) ON DELETE CASCADE
      );
    `;

    this.db.exec(schemaSQL);
  }

  // Nuevo método para verificar si necesitamos la migración 005
  private checkIfNeedsMT5Migration(): boolean {
    try {
      // Verificar si existe mt5_accounts
      const tableExists = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='mt5_accounts'"
        )
        .get();

      if (!tableExists) {
        return false; // No existe, se creará nueva
      }

      // Verificar estructura de la tabla
      const columns = this.db
        .prepare("PRAGMA table_info(mt5_accounts)")
        .all() as {
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: any;
        pk: number;
      }[];

      // Buscar si account_id es PRIMARY KEY
      const accountIdColumn = columns.find((col) => col.name === "account_id");
      const hasIdAsPK = columns.some(
        (col) => col.name === "id" && col.pk === 1
      );

      // Necesitamos migración si:
      // 1. account_id existe pero no es PK, O
      // 2. existe un campo 'id' como PK
      return !!accountIdColumn && (accountIdColumn.pk === 0 || hasIdAsPK);
    } catch (error) {
      console.error("Error verificando estructura MT5:", error);
      return false;
    }
  }

  // Nuevo método para ejecutar migración 005 inline
  private runMT5Migration005Inline(): void {
    const migrationSQL = `
    BEGIN TRANSACTION;
    
    -- Crear tabla temporal con estructura correcta
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
    
    -- Migrar datos existentes
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
    
    -- Eliminar tabla original
    DROP TABLE IF EXISTS mt5_accounts;
    
    -- Renombrar tabla nueva
    ALTER TABLE mt5_accounts_new RENAME TO mt5_accounts;
    
    -- Crear índices
    CREATE INDEX IF NOT EXISTS idx_mt5_accounts_company ON mt5_accounts(company);
    CREATE INDEX IF NOT EXISTS idx_mt5_accounts_currency ON mt5_accounts(currency);
    CREATE INDEX IF NOT EXISTS idx_mt5_accounts_created_at ON mt5_accounts(created_at);
    
    COMMIT;
  `;

    this.db.exec(migrationSQL);
  }

  // Nuevo método para crear tablas MT5 con estructura correcta
  private createMT5TablesInline(): void {
    const createSQL = `
    -- Crear tabla mt5_accounts con estructura correcta
    CREATE TABLE mt5_accounts (
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
    
    -- Crear tabla mt5_trades
    CREATE TABLE mt5_trades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket INTEGER NOT NULL,
      order_id INTEGER,
      symbol TEXT,
      volume REAL,
      price REAL,
      commission REAL,
      swap REAL,
      profit REAL,
      time INTEGER,
      type INTEGER,
      comment TEXT,
      magic INTEGER
    );
    
    -- Crear índices
    CREATE INDEX IF NOT EXISTS idx_mt5_accounts_company ON mt5_accounts(company);
    CREATE INDEX IF NOT EXISTS idx_mt5_accounts_currency ON mt5_accounts(currency);
    CREATE INDEX IF NOT EXISTS idx_mt5_accounts_created_at ON mt5_accounts(created_at);
    CREATE INDEX IF NOT EXISTS idx_mt5_trades_ticket ON mt5_trades(ticket);
    CREATE INDEX IF NOT EXISTS idx_mt5_trades_symbol ON mt5_trades(symbol);
  `;

    this.db.exec(createSQL);
  }

  // Método para verificar si necesita migración 006
  private checkIfNeedsMT5TradesMigration(): boolean {
    try {
      const tableExists = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='mt5_trades'"
        )
        .get();

      if (!tableExists) {
        return false; // No existe, se creará nueva
      }

      // Verificar estructura de la tabla
      const columns = this.db
        .prepare("PRAGMA table_info(mt5_trades)")
        .all() as {
        name: string;
        type: string;
        pk: number;
      }[];

      // Buscar si tiene la nueva estructura (trade_id, account_id, position_id)
      const hasTradeId = columns.some((col) => col.name === "trade_id");
      const hasAccountId = columns.some((col) => col.name === "account_id");
      const hasPositionId = columns.some((col) => col.name === "position_id");

      // Necesita migración si no tiene la nueva estructura
      return !(hasTradeId && hasAccountId && hasPositionId);
    } catch (error) {
      console.error("Error verificando estructura MT5 trades:", error);
      return false;
    }
  }

  // Migración inline para mt5_trades
  private runMT5TradesMigration006Inline(): void {
    const migrationSQL = `
      BEGIN TRANSACTION;
      
      -- Crear nueva tabla con estructura correcta
      CREATE TABLE IF NOT EXISTS mt5_trades_new (
          trade_id INTEGER PRIMARY KEY AUTOINCREMENT,
          account_id INTEGER,
          position_id BIGINT,
          symbol VARCHAR(20),
          trade_type VARCHAR(10),
          volume DECIMAL(10,2),
          open_time TIMESTAMP,
          open_price DECIMAL(15,5),
          close_time TIMESTAMP,
          close_price DECIMAL(15,5),
          profit DECIMAL(15,2),
          commission DECIMAL(15,2),
          swap DECIMAL(15,2),
          magic_number BIGINT,
          comment TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (account_id) REFERENCES mt5_accounts(account_id),
          UNIQUE(account_id, position_id)
      );
      
      -- Migrar datos existentes
      INSERT OR IGNORE INTO mt5_trades_new (
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
          NULL as account_id,
          ticket as position_id,
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
          SELECT 1 FROM sqlite_master 
          WHERE type='table' AND name='mt5_trades'
      );
      
      -- Eliminar tabla original
      DROP TABLE IF EXISTS mt5_trades;
      
      -- Renombrar tabla nueva
      ALTER TABLE mt5_trades_new RENAME TO mt5_trades;
      
      -- Crear índices
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_account_id ON mt5_trades(account_id);
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_position_id ON mt5_trades(position_id);
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_symbol ON mt5_trades(symbol);
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_trade_type ON mt5_trades(trade_type);
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_open_time ON mt5_trades(open_time);
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_close_time ON mt5_trades(close_time);
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_magic_number ON mt5_trades(magic_number);
      
      COMMIT;
    `;

    this.db.exec(migrationSQL);
  }

  // Migración 008: Verificar si se necesitan campos adicionales para MT5 trades
  private checkIfNeedsMT5FieldsMigration(): boolean {
    try {
      const tableInfo = this.db
        .prepare("PRAGMA table_info(mt5_trades)")
        .all() as Array<{ name: string }>;

      const hasStrategyId = tableInfo.some((col) => col.name === "strategy_id");
      const hasDescription = tableInfo.some(
        (col) => col.name === "description"
      );
      const hasNotes = tableInfo.some((col) => col.name === "notes");

      const hasAttachmentsTable =
        this.db
          .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='mt5_trade_attachments'"
          )
          .all().length > 0;

      return (
        !hasStrategyId || !hasDescription || !hasNotes || !hasAttachmentsTable
      );
    } catch (error) {
      console.error("Error verificando migración 008:", error);
      return false;
    }
  }

  // Migración 008: Agregar campos adicionales inline
  private runMT5FieldsMigration008Inline(): void {
    const migrationSQL = `
      BEGIN TRANSACTION;

      -- Agregar columnas para información adicional del usuario
      ALTER TABLE mt5_trades ADD COLUMN strategy_id INTEGER REFERENCES strategies(id) ON DELETE SET NULL;
      ALTER TABLE mt5_trades ADD COLUMN description TEXT;
      ALTER TABLE mt5_trades ADD COLUMN notes TEXT;

      -- Crear tabla de adjuntos para trades MT5
      CREATE TABLE IF NOT EXISTS mt5_trade_attachments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          mt5_trade_id INTEGER NOT NULL,
          file_path TEXT NOT NULL,
          file_type TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (mt5_trade_id) REFERENCES mt5_trades(trade_id) ON DELETE CASCADE
      );

      -- Crear índices para optimizar consultas
      CREATE INDEX IF NOT EXISTS idx_mt5_trades_strategy_id ON mt5_trades(strategy_id);
      CREATE INDEX IF NOT EXISTS idx_mt5_trade_attachments_trade_id ON mt5_trade_attachments(mt5_trade_id);

      COMMIT;
    `;

    this.db.exec(migrationSQL);
  }

  // Migración 009: Verificar si se necesita migración de planes de trading
  private checkIfNeedsTradingPlansMigration(): boolean {
    try {
      const tableExists = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='trading_plans'"
        )
        .get();

      return !tableExists; // Necesita migración si la tabla no existe
    } catch (error) {
      console.error("Error verificando migración 009:", error);
      return false;
    }
  }

  // Migración 009: Crear tabla de planes de trading inline
  private runTradingPlansMigration009Inline(): void {
    const migrationSQL = `
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
    `;

    this.db.exec(migrationSQL);
  }

  // Verificar si se necesita migración 010: Reestructurar planes de trading
  private checkIfNeedsTradingPlansRestructureMigration(): boolean {
    try {
      // Verificar si la tabla trading_plans existe
      const tableExists = this.db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='trading_plans'"
        )
        .get();

      if (!tableExists) {
        return false; // Si no existe la tabla, no necesita reestructurar
      }

      // Verificar si ya tiene las nuevas columnas
      const columns = this.db
        .prepare("PRAGMA table_info(trading_plans)")
        .all() as { name: string }[];

      const hasNewColumns = columns.some((col) => col.name === "tipo_trader");
      return !hasNewColumns; // Necesita migración si no tiene las nuevas columnas
    } catch (error) {
      console.error("Error verificando migración 010:", error);
      return false;
    }
  }

  // Migración 010: Reestructurar tabla de planes de trading inline
  private runTradingPlansRestructureMigration010Inline(): void {
    const migrationSQL = `
      -- Migración 010: Reestructurar tabla de planes de trading
      -- Simplificar y enfocar en la gestión de riesgo por operación

      BEGIN TRANSACTION;

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
    `;

    this.db.exec(migrationSQL);
  }

  createTrade(tradeData: TradeData) {
    const stmt = this.db.prepare(`
      INSERT INTO trades (
        symbol, order_type, exit_price, commissions, entry_date, exit_date, strategy_id, cuenta_trading_id, market_type, confidence, description, notes, status, pnl, result
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      tradeData.symbol,
      tradeData.orderType,
      tradeData.exitPrice ?? null,
      tradeData.commissions ?? null,
      tradeData.entryDate,
      tradeData.exitDate ?? null,
      tradeData.strategyId ?? null,
      tradeData.cuentaTradingId ?? null,
      tradeData.marketType ?? null,
      tradeData.confidence ?? null,
      tradeData.description ?? null,
      tradeData.notes ?? null,
      tradeData.status ?? "OPEN",
      tradeData.pnl ?? null,
      tradeData.result ?? null
    );
  }
  getTrades() {
    const stmt = this.db.prepare(
      `SELECT trades.id,
              trades.symbol,
              trades.order_type as orderType,
              trades.exit_price as exitPrice,
              trades.commissions,
              trades.entry_date as entryDate,
              trades.exit_date as exitDate,
              trades.strategy_id as strategyId,
              trades.cuenta_trading_id as cuentaTradingId,
              trades.market_type as marketType,
              trades.confidence,
              trades.description,
              trades.notes,
              trades.status,
              trades.pnl,
              trades.result,
              strategies.nombre as strategy,
              trading_accounts.nombre as cuentaNombre,
              trading_accounts.broker as cuentaBroker
       FROM trades
       LEFT JOIN strategies ON trades.strategy_id = strategies.id
       LEFT JOIN trading_accounts ON trades.cuenta_trading_id = trading_accounts.id
       ORDER BY trades.entry_date DESC`
    );
    return stmt.all();
  }
  updateTrade(trade: TradeData & { id: number }) {
    const stmt = this.db.prepare(`
      UPDATE trades SET
        symbol = ?,
        order_type = ?,
        exit_price = ?,
        commissions = ?,
        entry_date = ?,
        exit_date = ?,
        strategy_id = ?,
        cuenta_trading_id = ?,
        market_type = ?,
        confidence = ?,
        description = ?,
        notes = ?,
        status = ?,
        pnl = ?,
        result = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      trade.symbol,
      trade.orderType,
      trade.exitPrice ?? null,
      trade.commissions ?? null,
      trade.entryDate,
      trade.exitDate ?? null,
      trade.strategyId ?? null,
      trade.cuentaTradingId ?? null,
      trade.marketType ?? null,
      trade.confidence ?? null,
      trade.description ?? null,
      trade.notes ?? null,
      trade.status ?? "OPEN",
      trade.pnl ?? null,
      trade.result ?? null,
      trade.id
    );
    return stmt.run(
      trade.symbol,
      trade.orderType,
      trade.exitPrice ?? null,
      trade.commissions ?? null,
      trade.entryDate,
      trade.exitDate ?? null,
      trade.strategyId ?? null,
      trade.marketType ?? null,
      trade.confidence ?? null,
      trade.description ?? null,
      trade.notes ?? null,
      trade.status ?? "OPEN",
      trade.pnl ?? null,
      trade.result ?? null,
      trade.id
    );
  }

  deleteTrade(id: number) {
    const stmt = this.db.prepare(`DELETE FROM trades WHERE id = ?`);
    return stmt.run(id);
  }

  saveAttachment(
    tradeId: number,
    file: { buffer: Buffer; originalName: string; mimeType: string }
  ): string {
    const userDataPath = app.getPath("userData");
    const attachmentsDir = path.join(
      userDataPath,
      "attachments",
      String(tradeId)
    );
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
    }
    // Evita sobrescribir archivos con el mismo nombre
    let fileName = file.originalName;
    let filePath = path.join(attachmentsDir, fileName);
    let i = 1;
    while (fs.existsSync(filePath)) {
      const ext = path.extname(file.originalName);
      const base = path.basename(file.originalName, ext);
      fileName = `${base}_${i}${ext}`;
      filePath = path.join(attachmentsDir, fileName);
      i++;
    }
    fs.writeFileSync(filePath, file.buffer);
    // Registrar en la base de datos
    const stmt = this.db.prepare(
      `INSERT INTO attachments (trade_id, file_path, file_type) VALUES (?, ?, ?)`
    );
    stmt.run(tradeId, filePath, file.mimeType);
    return filePath;
  }

  getAttachments(tradeId: number) {
    const stmt = this.db.prepare(
      `SELECT id, file_path as filePath, file_type as fileType FROM attachments WHERE trade_id = ?`
    );
    return stmt.all(tradeId);
  }

  /**
   * Reads an attachment file and returns a data URL (base64) for secure preview.
   * @param filePath Absolute path to the file
   * @returns string (data URL)
   */
  readAttachmentFile(filePath: string): string {
    if (!fs.existsSync(filePath)) {
      throw new Error("Attachment file not found");
    }
    const buffer = fs.readFileSync(filePath);
    // Try to get mime type from DB if possible, fallback to extension
    let mimeType = "application/octet-stream";
    const ext = path.extname(filePath).toLowerCase();
    if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
    else if (ext === ".png") mimeType = "image/png";
    else if (ext === ".mp4") mimeType = "video/mp4";
    // Convert to base64 data URL
    const base64 = buffer.toString("base64");
    return `data:${mimeType};base64,${base64}`;
  }

  // Add more methods for strategies, attachments, user_settings as needed

  // Trading Accounts methods
  addTradingAccount(accountData: TradingAccountData) {
    const stmt = this.db.prepare(`
      INSERT INTO trading_accounts (
        nombre, broker, tipo_cuenta, moneda, balance_inicial, fecha_apertura, estado, notas
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      accountData.nombre,
      accountData.broker,
      accountData.tipoCuenta,
      accountData.moneda,
      accountData.balanceInicial ?? null,
      accountData.fechaApertura ?? null,
      accountData.estado,
      accountData.notas ?? null
    );
  }

  getTradingAccounts() {
    const stmt = this.db.prepare(`
      SELECT id,
             nombre,
             broker,
             tipo_cuenta as tipoCuenta,
             moneda,
             balance_inicial as balanceInicial,
             fecha_apertura as fechaApertura,
             estado,
             notas,
             created_at as createdAt,
             updated_at as updatedAt
      FROM trading_accounts
      ORDER BY nombre ASC
    `);
    return stmt.all();
  }

  updateTradingAccount(accountData: TradingAccountData & { id: number }) {
    const stmt = this.db.prepare(`
      UPDATE trading_accounts SET
        nombre = ?,
        broker = ?,
        tipo_cuenta = ?,
        moneda = ?,
        balance_inicial = ?,
        fecha_apertura = ?,
        estado = ?,
        notas = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      accountData.nombre,
      accountData.broker,
      accountData.tipoCuenta,
      accountData.moneda,
      accountData.balanceInicial ?? null,
      accountData.fechaApertura ?? null,
      accountData.estado,
      accountData.notas ?? null,
      accountData.id
    );
  }

  deleteTradingAccount(id: number) {
    // First check if there are trades associated with this account
    const tradesCount = this.db
      .prepare(
        `SELECT COUNT(*) as count FROM trades WHERE cuenta_trading_id = ?`
      )
      .get(id) as { count: number };

    if (tradesCount.count > 0) {
      throw new Error(
        "No se puede eliminar la cuenta porque tiene trades asociados"
      );
    }

    const stmt = this.db.prepare(`DELETE FROM trading_accounts WHERE id = ?`);
    return stmt.run(id);
  }

  getTradingAccountById(id: number) {
    const stmt = this.db.prepare(`
      SELECT id,
             nombre,
             broker,
             tipo_cuenta as tipoCuenta,
             moneda,
             balance_inicial as balanceInicial,
             fecha_apertura as fechaApertura,
             estado,
             notas,
             created_at as createdAt,
             updated_at as updatedAt
      FROM trading_accounts
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  // Strategies methods
  addStrategy(strategyData: StrategyData) {
    const stmt = this.db.prepare(`
      INSERT INTO strategies (
        nombre, descripcion, reglas, estado, notas
      ) VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(
      strategyData.nombre,
      strategyData.descripcion ?? null,
      strategyData.reglas ?? null,
      strategyData.estado,
      strategyData.notas ?? null
    );
  }

  getStrategies() {
    const stmt = this.db.prepare(`
      SELECT id,
             nombre,
             descripcion,
             reglas,
             estado,
             notas,
             created_at as createdAt,
             updated_at as updatedAt
      FROM strategies
      ORDER BY nombre ASC
    `);
    return stmt.all();
  }

  updateStrategy(strategyData: StrategyData & { id: number }) {
    const stmt = this.db.prepare(`
      UPDATE strategies SET
        nombre = ?,
        descripcion = ?,
        reglas = ?,
        estado = ?,
        notas = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(
      strategyData.nombre,
      strategyData.descripcion ?? null,
      strategyData.reglas ?? null,
      strategyData.estado,
      strategyData.notas ?? null,
      strategyData.id
    );
  }

  deleteStrategy(id: number) {
    // First check if there are trades associated with this strategy
    const tradesCount = this.db
      .prepare(`SELECT COUNT(*) as count FROM trades WHERE strategy_id = ?`)
      .get(id) as { count: number };

    if (tradesCount.count > 0) {
      throw new Error(
        "No se puede eliminar la estrategia porque tiene trades asociados"
      );
    }

    const stmt = this.db.prepare(`DELETE FROM strategies WHERE id = ?`);
    return stmt.run(id);
  }

  getStrategyById(id: number) {
    const stmt = this.db.prepare(`
      SELECT id,
             nombre,
             descripcion,
             reglas,
             estado,
             notas,
             created_at as createdAt,
             updated_at as updatedAt
      FROM strategies
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  // ============ TRADING PLANS METHODS ============

  // Método para crear un plan de trading
  createTradingPlan(planData: TradingPlanData) {
    console.log("DatabaseManager.createTradingPlan: Creando plan...", planData);

    const stmt = this.db.prepare(`
      INSERT INTO trading_plans (
        nombre, activo, tipo_trader,
        riesgo_max_diario_pct, max_operaciones_dia, riesgo_por_operacion_pct,
        relacion_rr_minima, perdida_max_semanal_pct,
        mercados_operacion, instrumentos_principales, 
        horario_operacion_inicio, horario_operacion_fin,
        reglas_personales, strategy_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        planData.nombre,
        planData.activo ? 1 : 0,
        planData.tipo_trader ?? null,
        planData.riesgo_max_diario_pct ?? null,
        planData.max_operaciones_dia ?? null,
        planData.riesgo_por_operacion_pct ?? null,
        planData.relacion_rr_minima ?? null,
        planData.perdida_max_semanal_pct ?? null,
        planData.mercados_operacion ?? null,
        planData.instrumentos_principales ?? null,
        planData.horario_operacion_inicio ?? null,
        planData.horario_operacion_fin ?? null,
        planData.reglas_personales ?? null,
        planData.strategy_id ?? null
      );

      console.log("Plan de trading creado:", result);
      return result;
    } catch (error) {
      console.error("Error creando plan de trading:", error);
      throw error;
    }
  }

  // Método para obtener todos los planes de trading
  getTradingPlans() {
    console.log("DatabaseManager.getTradingPlans: Consultando planes...");

    const stmt = this.db.prepare(`
      SELECT 
        tp.id,
        tp.nombre,
        tp.activo,
        tp.tipo_trader,
        tp.riesgo_max_diario_pct,
        tp.max_operaciones_dia,
        tp.riesgo_por_operacion_pct,
        tp.relacion_rr_minima,
        tp.perdida_max_semanal_pct,
        tp.mercados_operacion,
        tp.instrumentos_principales,
        tp.horario_operacion_inicio,
        tp.horario_operacion_fin,
        tp.reglas_personales,
        tp.strategy_id,
        tp.created_at,
        tp.updated_at,
        s.nombre as strategy_nombre
      FROM trading_plans tp
      LEFT JOIN strategies s ON tp.strategy_id = s.id
      ORDER BY tp.created_at DESC
    `);

    try {
      const results = stmt.all();
      console.log("Planes de trading encontrados:", results.length);
      return results;
    } catch (error) {
      console.error("Error consultando planes de trading:", error);
      return [];
    }
  }

  // Método para obtener un plan específico por ID
  getTradingPlanById(id: number): TradingPlanData | null {
    console.log("DatabaseManager.getTradingPlanById:", id);

    const stmt = this.db.prepare(`
      SELECT 
        tp.id,
        tp.nombre,
        tp.activo,
        tp.tipo_trader,
        tp.riesgo_max_diario_pct,
        tp.max_operaciones_dia,
        tp.riesgo_por_operacion_pct,
        tp.relacion_rr_minima,
        tp.perdida_max_semanal_pct,
        tp.mercados_operacion,
        tp.instrumentos_principales,
        tp.horario_operacion_inicio,
        tp.horario_operacion_fin,
        tp.reglas_personales,
        tp.strategy_id,
        tp.created_at,
        tp.updated_at,
        s.nombre as strategy_nombre
      FROM trading_plans tp
      LEFT JOIN strategies s ON tp.strategy_id = s.id
      WHERE tp.id = ?
    `);

    try {
      const result = stmt.get(id) as TradingPlanData;
      console.log("Plan encontrado:", result);
      return result;
    } catch (error) {
      console.error("Error consultando plan por ID:", error);
      return null;
    }
  }

  // Método para actualizar un plan de trading
  updateTradingPlan(planData: TradingPlanData & { id: number }) {
    console.log(
      "DatabaseManager.updateTradingPlan: Actualizando plan...",
      planData
    );

    const stmt = this.db.prepare(`
      UPDATE trading_plans SET
        nombre = ?,
        activo = ?,
        tipo_trader = ?,
        riesgo_max_diario_pct = ?,
        max_operaciones_dia = ?,
        riesgo_por_operacion_pct = ?,
        relacion_rr_minima = ?,
        perdida_max_semanal_pct = ?,
        mercados_operacion = ?,
        instrumentos_principales = ?,
        horario_operacion_inicio = ?,
        horario_operacion_fin = ?,
        reglas_personales = ?,
        strategy_id = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    try {
      const result = stmt.run(
        planData.nombre,
        planData.activo ? 1 : 0,
        planData.tipo_trader ?? null,
        planData.riesgo_max_diario_pct ?? null,
        planData.max_operaciones_dia ?? null,
        planData.riesgo_por_operacion_pct ?? null,
        planData.relacion_rr_minima ?? null,
        planData.perdida_max_semanal_pct ?? null,
        planData.mercados_operacion ?? null,
        planData.instrumentos_principales ?? null,
        planData.horario_operacion_inicio ?? null,
        planData.horario_operacion_fin ?? null,
        planData.reglas_personales ?? null,
        planData.strategy_id ?? null,
        planData.id
      );

      console.log("Plan de trading actualizado:", result);
      return result;
    } catch (error) {
      console.error("Error actualizando plan de trading:", error);
      throw error;
    }
  }

  // Método para eliminar un plan de trading
  deleteTradingPlan(id: number) {
    console.log("DatabaseManager.deleteTradingPlan:", id);

    // Verificar si hay trades asociados con este plan
    const mt5TradesCount = this.db
      .prepare(`SELECT COUNT(*) as count FROM mt5_trades WHERE plan_id = ?`)
      .get(id) as { count: number };

    const tradesCount = this.db
      .prepare(`SELECT COUNT(*) as count FROM trades WHERE plan_id = ?`)
      .get(id) as { count: number };

    if (mt5TradesCount.count > 0 || tradesCount.count > 0) {
      throw new Error(
        "No se puede eliminar el plan porque tiene trades asociados"
      );
    }

    const stmt = this.db.prepare(`DELETE FROM trading_plans WHERE id = ?`);

    try {
      const result = stmt.run(id);
      console.log("Plan de trading eliminado:", result);
      return result;
    } catch (error) {
      console.error("Error eliminando plan de trading:", error);
      throw error;
    }
  }

  // Método para obtener planes activos solamente
  getActiveTradingPlans() {
    console.log(
      "DatabaseManager.getActiveTradingPlans: Consultando planes activos..."
    );

    const stmt = this.db.prepare(`
      SELECT 
        tp.id,
        tp.nombre,
        tp.fecha_inicio,
        tp.fecha_fin,
        tp.meta_anual,
        tp.meta_mensual,
        tp.meta_semanal,
        tp.capital_disponible,
        tp.riesgo_max_operacion,
        s.nombre as strategy_nombre
      FROM trading_plans tp
      LEFT JOIN strategies s ON tp.strategy_id = s.id
      WHERE tp.activo = 1
      ORDER BY tp.created_at DESC
    `);

    try {
      const results = stmt.all();
      console.log("Planes activos encontrados:", results.length);
      return results;
    } catch (error) {
      console.error("Error consultando planes activos:", error);
      return [];
    }
  }

  // Método para validar si un trade cumple con las reglas de un plan
  // TODO: Refactorizar esta función para trabajar con la nueva estructura
  validateTradeAgainstPlan(
    planId: number,
    tradeData: {
      symbol: string;
      trade_type: "BUY" | "SELL";
      volume: number;
      open_time: string;
      profit: number;
    }
  ): { isValid: boolean; violations: string[] } {
    console.log("DatabaseManager.validateTradeAgainstPlan:", {
      planId,
      tradeData,
    });

    try {
      const plan = this.getTradingPlanById(planId);
      if (!plan) {
        return { isValid: false, violations: ["Plan no encontrado"] };
      }

      const violations: string[] = [];

      // Validar instrumentos permitidos
      if (plan.instrumentos_principales) {
        const instrumentos = JSON.parse(
          plan.instrumentos_principales
        ) as string[];
        if (
          instrumentos.length > 0 &&
          !instrumentos.includes(tradeData.symbol)
        ) {
          violations.push(
            `El símbolo ${tradeData.symbol} no está en la lista de instrumentos permitidos`
          );
        }
      }

      // Validar horario de operación
      if (plan.horario_operacion_inicio && plan.horario_operacion_fin) {
        const tradeTime = new Date(tradeData.open_time);
        const tradeHour = tradeTime.getHours() * 100 + tradeTime.getMinutes();
        const startTime = parseInt(
          plan.horario_operacion_inicio.replace(":", "")
        );
        const endTime = parseInt(plan.horario_operacion_fin.replace(":", ""));

        if (tradeHour < startTime || tradeHour > endTime) {
          violations.push(
            `Trade ejecutado fuera del horario permitido (${plan.horario_operacion_inicio} - ${plan.horario_operacion_fin})`
          );
        }
      }

      // TODO: Implementar validación de riesgo con nueva estructura

      return {
        isValid: violations.length === 0,
        violations,
      };
    } catch (error) {
      console.error("Error validando trade contra plan:", error);
      return { isValid: false, violations: ["Error en validación"] };
    }
  }

  // Método para obtener estadísticas de progreso de un plan
  getPlanProgress(planId: number) {
    console.log("DatabaseManager.getPlanProgress:", planId);

    try {
      const plan = this.getTradingPlanById(planId);
      if (!plan) {
        return null;
      }

      // Obtener trades asociados al plan (tanto MT5 como manuales)
      const mt5Trades = this.db
        .prepare(
          `
        SELECT profit, commission, swap, open_time
        FROM mt5_trades 
        WHERE plan_id = ?
        ORDER BY open_time DESC
      `
        )
        .all(planId);

      const manualTrades = this.db
        .prepare(
          `
        SELECT pnl, commissions, entry_date
        FROM trades 
        WHERE plan_id = ?
        ORDER BY entry_date DESC
      `
        )
        .all(planId);

      // Calcular métricas
      const totalTrades = mt5Trades.length + manualTrades.length;

      const totalProfit =
        mt5Trades.reduce(
          (sum: number, trade: any) =>
            sum + (trade.profit - trade.commission - trade.swap),
          0
        ) +
        manualTrades.reduce(
          (sum: number, trade: any) =>
            sum + ((trade.pnl || 0) - (trade.commissions || 0)),
          0
        );

      const winningTrades =
        mt5Trades.filter((t: any) => t.profit > 0).length +
        manualTrades.filter((t: any) => (t.pnl || 0) > 0).length;

      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

      // TODO: Refactorizar cálculo de progreso para la nueva estructura
      return {
        planId,
        planNombre: plan.nombre,
        totalTrades,
        totalProfit,
        winningTrades,
        losingTrades: totalTrades - winningTrades,
        winRate,
        riesgoActual: 0, // TODO: calcular riesgo usado hoy
        operacionesHoy: 0, // TODO: calcular operaciones de hoy
        riesgoDisponible: 0, // TODO: calcular riesgo disponible
      };
    } catch (error) {
      console.error("Error calculando progreso del plan:", error);
      return null;
    }
  }

  close() {
    this.db.close();
  }

  // Método para diagnosticar el problema de created_at
  diagnoseMT5CreatedAtIssue() {
    console.log("=== DIAGNÓSTICO MT5 CREATED_AT ===");

    try {
      // 1. Verificar cuentas MT5 existentes
      const accounts = this.db.prepare("SELECT * FROM mt5_accounts").all();
      console.log("Cuentas MT5 existentes:", accounts.length);
      accounts.forEach((account: any) => {
        console.log(
          `  - Cuenta ${account.account_id}: created_at=${account.created_at}`
        );
      });

      // 2. Verificar estructura de tabla mt5_trades
      const tradesTableInfo = this.db
        .prepare("PRAGMA table_info(mt5_trades)")
        .all();
      console.log("Estructura tabla mt5_trades:");
      tradesTableInfo.forEach((col: any) => {
        console.log(`  - ${col.name}: ${col.type}`);
      });

      // 3. Buscar trades con depósito inicial (estructura nueva)
      try {
        const depositsNew = this.db
          .prepare(
            `
          SELECT account_id, open_time, comment, profit
          FROM mt5_trades 
          WHERE comment LIKE '%INITIAL_DEPOSIT%' 
             OR comment LIKE '%Deposito Inicial%'
             OR comment LIKE '%DEPOSIT%'
          ORDER BY open_time ASC
        `
          )
          .all();
        console.log(
          "Depósitos encontrados (estructura nueva):",
          depositsNew.length
        );
        depositsNew.forEach((dep: any) => {
          console.log(
            `  - Cuenta ${dep.account_id}: ${dep.open_time} - ${dep.comment} - $${dep.profit}`
          );
        });
      } catch (error) {
        console.log(
          "No se pudo consultar mt5_trades con estructura nueva:",
          error
        );
      }

      // 4. Buscar trades con depósito inicial (vista legacy)
      try {
        const depositsLegacy = this.db
          .prepare(
            `
          SELECT * FROM mt5_trades_legacy 
          WHERE comment LIKE '%INITIAL_DEPOSIT%' 
             OR comment LIKE '%Deposito Inicial%'
             OR comment LIKE '%DEPOSIT%'
          ORDER BY time ASC
        `
          )
          .all();
        console.log(
          "Depósitos encontrados (vista legacy):",
          depositsLegacy.length
        );
        depositsLegacy.forEach((dep: any) => {
          console.log(
            `  - Ticket ${dep.ticket}: ${new Date(
              dep.time * 1000
            ).toISOString()} - ${dep.comment} - $${dep.profit}`
          );
        });
      } catch (error) {
        console.log("No se pudo consultar mt5_trades_legacy:", error);
      }

      // 5. Verificar tabla de control de migraciones
      try {
        const migrationControl = this.db
          .prepare("SELECT * FROM migration_control")
          .all();
        console.log("Control de migraciones:", migrationControl);
      } catch (error) {
        console.log("Tabla migration_control no existe:", error);
      }

      console.log("=== FIN DIAGNÓSTICO ===");
    } catch (error) {
      console.error("Error en diagnóstico:", error);
    }
  }

  // Método para forzar actualización de created_at
  forceUpdateMT5AccountsCreatedAt() {
    console.log("=== FORZANDO ACTUALIZACIÓN CREATED_AT ===");

    try {
      // Primero ejecutar diagnóstico
      this.diagnoseMT5CreatedAtIssue();

      // Intentar actualización con diferentes enfoques
      console.log("Método 1: Usando estructura nueva mt5_trades...");
      const result1 = this.db
        .prepare(
          `
        UPDATE mt5_accounts 
        SET created_at = (
            SELECT MIN(open_time) 
            FROM mt5_trades 
            WHERE (
                comment LIKE '%INITIAL_DEPOSIT%' 
                OR comment LIKE '%Deposito Inicial%'
                OR comment LIKE '%DEPOSIT%'
            )
            AND account_id = mt5_accounts.account_id
        )
        WHERE EXISTS (
            SELECT 1 
            FROM mt5_trades 
            WHERE (
                comment LIKE '%INITIAL_DEPOSIT%' 
                OR comment LIKE '%Deposito Inicial%'
                OR comment LIKE '%DEPOSIT%'
            )
            AND account_id = mt5_accounts.account_id
        )
      `
        )
        .run();
      console.log("Resultado método 1:", result1);

      // Método 2: Usar vista legacy si existe
      try {
        console.log("Método 2: Usando vista legacy...");
        const result2 = this.db
          .prepare(
            `
          UPDATE mt5_accounts 
          SET created_at = (
              SELECT datetime(MIN(time), 'unixepoch') 
              FROM mt5_trades_legacy 
              WHERE comment LIKE '%INITIAL_DEPOSIT%' 
                 OR comment LIKE '%Deposito Inicial%'
                 OR comment LIKE '%DEPOSIT%'
          )
          WHERE created_at IS NULL OR created_at = ''
        `
          )
          .run();
        console.log("Resultado método 2:", result2);
      } catch (error) {
        console.log("Método 2 falló (vista legacy no disponible):", error);
      }

      // Verificar resultados
      const updatedAccounts = this.db
        .prepare(
          "SELECT account_id, account_name, created_at FROM mt5_accounts"
        )
        .all();
      console.log("Cuentas después de actualización:");
      updatedAccounts.forEach((account: any) => {
        console.log(`  - Cuenta ${account.account_id}: ${account.created_at}`);
      });

      console.log("=== FIN ACTUALIZACIÓN FORZADA ===");
      return updatedAccounts;
    } catch (error) {
      console.error("Error en actualización forzada:", error);
      throw error;
    }
  }

  // Método para actualizar trades MT5 con información adicional
  updateMT5Trade(
    tradeId: number,
    updateData: {
      strategy_id?: number;
      description?: string;
      notes?: string;
    }
  ): void {
    console.log("DatabaseManager.updateMT5Trade: Actualizando trade...", {
      tradeId,
      updateData,
    });

    try {
      const fields = [];
      const values = [];

      if (updateData.strategy_id !== undefined) {
        fields.push("strategy_id = ?");
        values.push(updateData.strategy_id);
      }
      if (updateData.description !== undefined) {
        fields.push("description = ?");
        values.push(updateData.description);
      }
      if (updateData.notes !== undefined) {
        fields.push("notes = ?");
        values.push(updateData.notes);
      }

      if (fields.length === 0) {
        console.log("No hay campos para actualizar");
        return;
      }

      values.push(tradeId);

      const query = `UPDATE mt5_trades SET ${fields.join(
        ", "
      )} WHERE trade_id = ?`;
      const stmt = this.db.prepare(query);
      const result = stmt.run(...values);

      console.log("Trade MT5 actualizado:", result);
    } catch (error) {
      console.error("Error actualizando trade MT5:", error);
      throw error;
    }
  }

  // Método para guardar adjuntos de trades MT5
  saveMT5TradeAttachment(
    tradeId: number,
    filePath: string,
    fileType: string
  ): void {
    console.log("DatabaseManager.saveMT5TradeAttachment:", {
      tradeId,
      filePath,
      fileType,
    });

    try {
      const stmt = this.db.prepare(`
        INSERT INTO mt5_trade_attachments (mt5_trade_id, file_path, file_type)
        VALUES (?, ?, ?)
      `);
      const result = stmt.run(tradeId, filePath, fileType);
      console.log("Adjunto MT5 guardado:", result);
    } catch (error) {
      console.error("Error guardando adjunto MT5:", error);
      throw error;
    }
  }

  // Método para obtener adjuntos de trades MT5
  getMT5TradeAttachments(tradeId: number): MT5TradeAttachment[] {
    console.log("DatabaseManager.getMT5TradeAttachments:", { tradeId });

    try {
      const stmt = this.db.prepare(`
        SELECT id, mt5_trade_id, file_path as filePath, file_type as fileType, created_at
        FROM mt5_trade_attachments
        WHERE mt5_trade_id = ?
        ORDER BY created_at DESC
      `);
      const results = stmt.all(tradeId) as MT5TradeAttachment[];
      console.log("Adjuntos MT5 encontrados:", results.length);
      return results;
    } catch (error) {
      console.error("Error obteniendo adjuntos MT5:", error);
      throw error;
    }
  }
}
