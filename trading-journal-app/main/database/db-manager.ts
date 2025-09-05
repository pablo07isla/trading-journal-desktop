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

export class DatabaseManager {
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
    // Check if database exists and needs migration
    const tables = this.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='trades'"
      )
      .all();

    if (tables.length > 0) {
      // Check if the old schema exists (has quantity column)
      const columns = this.db.prepare("PRAGMA table_info(trades)").all() as {
        name: string;
      }[];
      const hasQuantityColumn = columns.some((col) => col.name === "quantity");
      if (hasQuantityColumn) {
        console.log("Running database migration...");
        try {
          // Run migration
          const migrationPath = path.join(__dirname, "migration-001.sql");
          if (fs.existsSync(migrationPath)) {
            const migration = fs.readFileSync(migrationPath, "utf8");
            this.db.exec(migration);
            console.log("Database migration completed");
          } else {
            // Fallback: run migration inline if file doesn't exist
            console.log(
              "Migration file not found, running inline migration..."
            );
            this.runInlineMigration();
            console.log("Inline migration completed");
          }
        } catch (error) {
          console.error("Migration failed:", error);
          // Try inline migration as fallback
          console.log("Attempting inline migration as fallback...");
          this.runInlineMigration();
        }
      }
    } else {
      // Fresh database, use the new schema
      const schemaPath = path.join(__dirname, "schema.sql");
      if (fs.existsSync(schemaPath)) {
        const schema = fs.readFileSync(schemaPath, "utf8");
        this.db.exec(schema);
      } else {
        // Fallback: create schema inline
        this.createInlineSchema();
      }
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

  close() {
    this.db.close();
  }
}
