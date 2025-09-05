import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
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

  // Add more methods for attachments, settings, etc.
});

// TypeScript global declaration for window.electronAPI
export {}; // Ensures this file is a module

declare global {
  interface Window {
    electronAPI: {
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
    };
  }
}

// Archivo preload para Electron
// ...implementación futura...
