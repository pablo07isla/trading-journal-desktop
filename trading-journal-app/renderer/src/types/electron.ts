// Shared type for grouped MT5 trades
export interface MT5TradeInsertData {
  account_id: number;
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

// MT5 Trade data as returned from database
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
  plan_id?: number;
  description?: string;
  notes?: string;
}
// MT5 Account and Trade types
export interface MT5Account {
  account_id: number;
  account_name: string;
  company: string;
  currency: string;
  type: "Challenge" | "Funded" | "Live" | "Demo";
  initial_balance: number;
  current_balance: number;
  pnl: number; // P&L
  created_at: string;
}

export interface MT5Trade {
  ticket: number;
  account_id: number;
  symbol: string;
  type: string;
  lots: number;
  open_time: string;
  close_time: string;
  open_price: number;
  close_price: number;
  profit: number;
  commission: number;
  swap: number;
  comment?: string;
}
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
  createdAt?: string;
  updatedAt?: string;
}

export interface AttachmentFile {
  name: string;
  path: string;
  type: string;
  isAttachment: true;
}

// Tipo de trader
export type TipoTrader = "Scalper" | "Intraday" | "Swing";

// Interface para planes de trading
export interface TradingPlanData {
  id?: number;
  nombre: string;
  activo: boolean;

  // Información general
  tipo_trader?: TipoTrader;

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
  strategy_nombre?: string; // JOIN con strategies table

  // Metadatos
  created_at?: string;
  updated_at?: string;
}

// Tipos para configuración de mercados y reglas
export type MarketSession = "NY" | "Asia" | "London";

// Interfaces para diferentes secciones del plan de trading
export interface RiskManagement {
  riesgo_max_diario_pct?: number;
  max_operaciones_dia?: number;
  riesgo_por_operacion_pct?: number;
  relacion_rr_minima?: number;
  perdida_max_semanal_pct?: number;
}

export interface MarketConfig {
  mercados_operacion: MarketSession[];
  instrumentos_principales: string[];
  horario_operacion_inicio?: string;
  horario_operacion_fin?: string;
}

export interface PlanValidation {
  isValid: boolean;
  violations: string[];
}

export interface PlanProgress {
  planId: number;
  planNombre: string;
  totalTrades: number;
  totalProfit: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  riesgoActual: number; // Riesgo usado hasta ahora en el día
  operacionesHoy: number; // Número de operaciones ejecutadas hoy
  riesgoDisponible: number; // Riesgo que queda disponible para el día
}

export interface MT5TradeAttachment {
  id: number;
  mt5_trade_id: number;
  filePath: string;
  fileType: string;
  created_at: string;
}

export interface ElectronAPI {
  getMT5AccountTrades: (accountId?: number | null) => Promise<{
    success: boolean;
    data?: MT5TradeData[];
    error?: string;
  }>;
  getMT5Accounts: () => Promise<{
    success: boolean;
    data?: MT5Account[];
    error?: string;
  }>;
  updateMT5Account: (
    accountId: number,
    updateData: Partial<MT5Account>
  ) => Promise<{
    success: boolean;
    data?: { changes: number; lastInsertRowid: number };
    error?: string;
  }>;
  importMT5Data: () => Promise<{
    success: boolean;
    data?: {
      account: MT5Account;
      trades: MT5TradeData[];
      summary: {
        accountsImported: number;
        tradesImported: number;
        tradesSkipped: number;
        errors: string[];
      };
    };
    error?: string;
  }>;
  clearAllMT5Trades: () => Promise<{
    success: boolean;
    data?: { changes: number };
    error?: string;
  }>;
  diagnoseMT5CreatedAt: () => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  forceUpdateMT5CreatedAt: () => Promise<{
    success: boolean;
    data?: MT5Account[];
    error?: string;
  }>;
  // Nuevos métodos para MT5 trades con información adicional
  updateMT5Trade: (
    tradeId: number,
    updateData: {
      strategy_id?: number;
      description?: string;
      notes?: string;
    }
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  saveMT5TradeAttachment: (
    tradeId: number,
    file: { buffer: ArrayBuffer; originalName: string; mimeType: string }
  ) => Promise<{
    success: boolean;
    filePath?: string;
    error?: string;
  }>;
  getMT5TradeAttachments: (tradeId: number) => Promise<{
    success: boolean;
    data?: MT5TradeAttachment[];
    error?: string;
  }>;
  readMT5TradeAttachmentFile: (filePath: string) => Promise<string | null>;
  createTrade: (tradeData: TradeData) => Promise<{ lastInsertRowid: number }>;
  getTrades: () => Promise<TradeData[]>;
  updateTrade: (tradeData: TradeData & { id: number }) => Promise<void>;
  deleteTrade: (id: number) => Promise<void>;
  saveAttachment: (
    tradeId: number,
    file: { buffer: ArrayBuffer; originalName: string; mimeType: string }
  ) => Promise<string>;
  getAttachments: (
    tradeId: number
  ) => Promise<Array<{ id: number; filePath: string; fileType: string }>>;
  readAttachmentFile: (filePath: string) => Promise<string | null>;
  // Trading Accounts methods
  createTradingAccount: (accountData: TradingAccountData) => Promise<void>;
  getTradingAccounts: () => Promise<TradingAccountData[]>;
  updateTradingAccount: (
    accountData: TradingAccountData & { id: number }
  ) => Promise<void>;
  deleteTradingAccount: (id: number) => Promise<void>;
  getTradingAccountById: (id: number) => Promise<TradingAccountData>;

  // Strategies methods
  createStrategy: (strategyData: StrategyData) => Promise<void>;
  getStrategies: () => Promise<StrategyData[]>;
  updateStrategy: (
    strategyData: StrategyData & { id: number }
  ) => Promise<void>;
  deleteStrategy: (id: number) => Promise<void>;
  getStrategyById: (id: number) => Promise<StrategyData>;

  // Trading Plans methods
  createTradingPlan: (planData: TradingPlanData) => Promise<{
    success: boolean;
    data?: { lastInsertRowid: number; changes: number };
    error?: string;
  }>;
  getTradingPlans: () => Promise<{
    success: boolean;
    data?: TradingPlanData[];
    error?: string;
  }>;
  getTradingPlanById: (id: number) => Promise<{
    success: boolean;
    data?: TradingPlanData;
    error?: string;
  }>;
  updateTradingPlan: (planData: TradingPlanData & { id: number }) => Promise<{
    success: boolean;
    data?: { changes: number };
    error?: string;
  }>;
  deleteTradingPlan: (id: number) => Promise<{
    success: boolean;
    data?: { changes: number };
    error?: string;
  }>;
  getActiveTradingPlans: () => Promise<{
    success: boolean;
    data?: TradingPlanData[];
    error?: string;
  }>;
  validateTradeAgainstPlan: (
    planId: number,
    tradeData: {
      symbol: string;
      trade_type: "BUY" | "SELL";
      volume: number;
      open_time: string;
      profit: number;
    }
  ) => Promise<{
    success: boolean;
    data?: PlanValidation;
    error?: string;
  }>;
  getPlanProgress: (planId: number) => Promise<{
    success: boolean;
    data?: PlanProgress;
    error?: string;
  }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
