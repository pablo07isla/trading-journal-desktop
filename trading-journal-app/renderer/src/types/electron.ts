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

export interface ElectronAPI {
  createTrade: (tradeData: TradeData) => Promise<any>;
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
  createTradingAccount: (accountData: TradingAccountData) => Promise<any>;
  getTradingAccounts: () => Promise<TradingAccountData[]>;
  updateTradingAccount: (
    accountData: TradingAccountData & { id: number }
  ) => Promise<void>;
  deleteTradingAccount: (id: number) => Promise<void>;
  getTradingAccountById: (id: number) => Promise<TradingAccountData>;

  // Strategies methods
  createStrategy: (strategyData: StrategyData) => Promise<any>;
  getStrategies: () => Promise<StrategyData[]>;
  updateStrategy: (
    strategyData: StrategyData & { id: number }
  ) => Promise<void>;
  deleteStrategy: (id: number) => Promise<void>;
  getStrategyById: (id: number) => Promise<StrategyData>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
