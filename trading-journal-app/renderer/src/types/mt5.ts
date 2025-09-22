// Tipos para datos de cuentas y trades MT5 actualizados según la estructura de DB

export interface MT5AccountData {
  account_id: number;
  account_name?: string;
  company?: string;
  currency?: string;
  type?: string;
  initial_balance: number;
  current_balance: number;
  pnl: number;
  profit_target_percent?: number;
  stop_target_percent?: number;
  daily_loss_percent?: number;
  created_at?: string;
}

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
  created_at?: string;
}

// Tipos para métricas de MT5 trades
export interface MT5TradesMetrics {
  totalTrades: number;
  closedTrades: number;
  openTrades: number;
  winTrades: number;
  loseTrades: number;
  breakEvenTrades: number;
  totalProfit: number;
  totalCommission: number;
  totalSwap: number;
  netPnL: number;
  avgProfit: number;
  maxProfit: number;
  minProfit: number;
  grossProfit: number;
  grossLoss: number;
  avgVolume: number;
  totalVolume: number;
}

// Tipos para distribución P&L
export interface MT5PnLDistributionItem {
  profit: number;
  commission: number;
  swap: number;
  netPnL: number;
  symbol: string;
  tradeType: "BUY" | "SELL";
  openTime: string;
}

// Tipos para métricas por símbolo
export interface MT5MetricsBySymbol {
  symbol: string;
  totalTrades: number;
  winTrades: number;
  netPnL: number;
  avgProfit: number;
  maxProfit: number;
  minProfit: number;
  totalVolume: number;
}

// Tipos para métricas por cuenta
export interface MT5MetricsByAccount {
  account_id: number;
  account_name?: string;
  totalTrades: number;
  winTrades: number;
  netPnL: number;
  avgProfit: number;
  maxProfit: number;
  minProfit: number;
  totalVolume: number;
}

// Tipos para equity curve
export interface MT5EquityCurveItem {
  open_time: string;
  profit: number;
  commission: number;
  swap: number;
  netPnL: number;
}

// Filtros para consultas MT5
export interface MT5TradeFilters {
  accountId?: number;
  symbol?: string;
  tradeType?: "BUY" | "SELL";
  magicNumber?: number;
  dateFrom?: string;
  dateTo?: string;
  onlyClosedTrades?: boolean;
}

export interface MT5MetricFilters {
  accountId?: number;
  symbol?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Tipos legacy para compatibilidad
export interface MT5Account {
  id: string;
  broker: string;
  balance: number;
  equity: number;
}

export interface MT5Trade {
  id: string;
  accountId: string;
  symbol: string;
  entry: number;
  sl: number;
  tp: number;
  openTime: string;
  closeTime: string;
  result: number;
}
