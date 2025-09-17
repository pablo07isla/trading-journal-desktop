import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  getMT5AccountTrades: async (
    accountId?: number | null
  ): Promise<{ success: boolean; data?: any[]; error?: string }> =>
    await ipcRenderer.invoke("get-mt5-account-trades", accountId),
  getMT5Accounts: async (): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> => await ipcRenderer.invoke("get-mt5-accounts"),
  updateMT5Account: async (
    accountId: number,
    updateData: any
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => await ipcRenderer.invoke("update-mt5-account", accountId, updateData),
  importMT5Data: async () => await ipcRenderer.invoke("import-mt5-data"),
  clearAllMT5Trades: async (): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> => await ipcRenderer.invoke("clear-all-mt5-trades"),
  diagnoseMT5CreatedAt: async (): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> => await ipcRenderer.invoke("diagnose-mt5-created-at"),
  forceUpdateMT5CreatedAt: async (): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> => await ipcRenderer.invoke("force-update-mt5-created-at"),
  createTrade: (tradeData: any) =>
    ipcRenderer.invoke("db:create-trade", tradeData),
  getTrades: () => ipcRenderer.invoke("db:get-trades"),
  updateTrade: (tradeData: any) =>
    ipcRenderer.invoke("db:update-trade", tradeData),
  deleteTrade: (id: number) => ipcRenderer.invoke("db:delete-trade", id),
  saveAttachment: (
    tradeId: number,
    file: { buffer: ArrayBuffer; originalName: string; mimeType: string }
  ) => ipcRenderer.invoke("db:save-attachment", tradeId, file),
  getAttachments: (tradeId: number) =>
    ipcRenderer.invoke("db:get-attachments", tradeId),
  readAttachmentFile: (filePath: string) =>
    ipcRenderer.invoke("db:read-attachment-file", filePath),

  // Trading Accounts methods
  createTradingAccount: (accountData: any) =>
    ipcRenderer.invoke("db:create-trading-account", accountData),
  getTradingAccounts: () => ipcRenderer.invoke("db:get-trading-accounts"),
  updateTradingAccount: (accountData: any) =>
    ipcRenderer.invoke("db:update-trading-account", accountData),
  deleteTradingAccount: (id: number) =>
    ipcRenderer.invoke("db:delete-trading-account", id),
  getTradingAccountById: (id: number) =>
    ipcRenderer.invoke("db:get-trading-account-by-id", id),

  // Strategies methods
  createStrategy: (strategyData: any) =>
    ipcRenderer.invoke("db:create-strategy", strategyData),
  getStrategies: () => ipcRenderer.invoke("db:get-strategies"),
  updateStrategy: (strategyData: any) =>
    ipcRenderer.invoke("db:update-strategy", strategyData),
  deleteStrategy: (id: number) => ipcRenderer.invoke("db:delete-strategy", id),
  getStrategyById: (id: number) =>
    ipcRenderer.invoke("db:get-strategy-by-id", id),

  // MT5 Trade methods
  updateMT5Trade: (tradeId: number, updateData: any) =>
    ipcRenderer.invoke("update-mt5-trade", tradeId, updateData),
  saveMT5TradeAttachment: (
    tradeId: number,
    file: { buffer: ArrayBuffer; originalName: string; mimeType: string }
  ) => ipcRenderer.invoke("save-mt5-trade-attachment", tradeId, file),
  getMT5TradeAttachments: (tradeId: number) =>
    ipcRenderer.invoke("get-mt5-trade-attachments", tradeId),
  readMT5TradeAttachmentFile: (filePath: string) =>
    ipcRenderer.invoke("read-mt5-trade-attachment-file", filePath),

  // Trading Plans methods
  createTradingPlan: (planData: any) =>
    ipcRenderer.invoke("db:create-trading-plan", planData),
  getTradingPlans: () => ipcRenderer.invoke("db:get-trading-plans"),
  getTradingPlanById: (id: number) =>
    ipcRenderer.invoke("db:get-trading-plan-by-id", id),
  updateTradingPlan: (planData: any) =>
    ipcRenderer.invoke("db:update-trading-plan", planData),
  deleteTradingPlan: (id: number) =>
    ipcRenderer.invoke("db:delete-trading-plan", id),
  getActiveTradingPlans: () =>
    ipcRenderer.invoke("db:get-active-trading-plans"),
  validateTradeAgainstPlan: (planId: number, tradeData: any) =>
    ipcRenderer.invoke("db:validate-trade-against-plan", planId, tradeData),
  getPlanProgress: (planId: number) =>
    ipcRenderer.invoke("db:get-plan-progress", planId),

  // ============ NUEVOS MÉTODOS MT5 PARA DASHBOARD ============

  // Métodos MT5 avanzados para dashboard
  getMT5TradesWithFilters: (filters?: any) =>
    ipcRenderer.invoke("db:get-mt5-trades-with-filters", filters),
  getMT5TradesMetrics: (filters?: any) =>
    ipcRenderer.invoke("db:get-mt5-trades-metrics", filters),
  getMT5PnLDistribution: (filters?: any) =>
    ipcRenderer.invoke("db:get-mt5-pnl-distribution", filters),
  getMT5UniqueSymbols: () => ipcRenderer.invoke("db:get-mt5-unique-symbols"),
  getMT5EquityCurve: (filters?: any) =>
    ipcRenderer.invoke("db:get-mt5-equity-curve", filters),
  getMT5MetricsBySymbol: (filters?: any) =>
    ipcRenderer.invoke("db:get-mt5-metrics-by-symbol", filters),
  getMT5MetricsByAccount: (filters?: any) =>
    ipcRenderer.invoke("db:get-mt5-metrics-by-account", filters),
  getMT5AccountsFromDB: () => ipcRenderer.invoke("db:get-mt5-accounts"),

  // Add more methods for attachments, settings, etc.
});

// TypeScript global declaration for window.electronAPI
export {}; // Ensures this file is a module

declare global {
  interface Window {
    electronAPI: {
      getMT5AccountTrades: (accountId?: number | null) => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      createTrade: (tradeData: any) => Promise<void>;
      getTrades: () => Promise<any[]>;
      updateTrade: (tradeData: any) => Promise<void>;
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
      createTradingAccount: (accountData: any) => Promise<void>;
      getTradingAccounts: () => Promise<any[]>;
      updateTradingAccount: (accountData: any) => Promise<void>;
      deleteTradingAccount: (id: number) => Promise<void>;
      getTradingAccountById: (id: number) => Promise<any>;

      // Strategies methods
      createStrategy: (strategyData: any) => Promise<void>;
      getStrategies: () => Promise<any[]>;
      updateStrategy: (strategyData: any) => Promise<void>;
      deleteStrategy: (id: number) => Promise<void>;
      getStrategyById: (id: number) => Promise<any>;

      // Add more methods as needed
      importMT5Data: () => Promise<{
        success: boolean;
        data?: { account: any; trades: any[] };
        error?: string;
      }>;
      getMT5Accounts: () => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      updateMT5Account: (
        accountId: number,
        updateData: any
      ) => Promise<{
        success: boolean;
        data?: any;
        error?: string;
      }>;
      diagnoseMT5CreatedAt: () => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      forceUpdateMT5CreatedAt: () => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;

      // ============ NUEVOS MÉTODOS MT5 PARA DASHBOARD ============

      // Métodos MT5 avanzados para dashboard
      getMT5TradesWithFilters: (filters?: {
        accountId?: number;
        symbol?: string;
        tradeType?: "BUY" | "SELL";
        magicNumber?: number;
        dateFrom?: string;
        dateTo?: string;
        onlyClosedTrades?: boolean;
      }) => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      getMT5TradesMetrics: (filters?: {
        accountId?: number;
        symbol?: string;
        dateFrom?: string;
        dateTo?: string;
      }) => Promise<{
        success: boolean;
        data?: any;
        error?: string;
      }>;
      getMT5PnLDistribution: (filters?: {
        accountId?: number;
        symbol?: string;
        dateFrom?: string;
        dateTo?: string;
      }) => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      getMT5UniqueSymbols: () => Promise<{
        success: boolean;
        data?: string[];
        error?: string;
      }>;
      getMT5EquityCurve: (filters?: {
        accountId?: number;
        symbol?: string;
        dateFrom?: string;
        dateTo?: string;
      }) => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      getMT5MetricsBySymbol: (filters?: {
        accountId?: number;
        dateFrom?: string;
        dateTo?: string;
      }) => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      getMT5MetricsByAccount: (filters?: {
        dateFrom?: string;
        dateTo?: string;
      }) => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
      getMT5AccountsFromDB: () => Promise<{
        success: boolean;
        data?: any[];
        error?: string;
      }>;
    };
  }
}

// Archivo preload para Electron
// ...implementación futura...
