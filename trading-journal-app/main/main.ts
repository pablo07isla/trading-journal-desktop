import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import { DatabaseManager } from "./database/db-manager";

let mainWindow: BrowserWindow;
let dbManager: DatabaseManager;

const createWindow = () => {
  // Determinar la ruta del icono según el entorno
  const isDev = !app.isPackaged;
  let iconPath: string;

  if (isDev) {
    // En desarrollo
    iconPath = path.join(__dirname, "../renderer/src/assets/AppIcon.ico");
  } else {
    // En producción
    iconPath = path.join(
      process.resourcesPath,
      "app.asar.unpacked/renderer/src/assets/AppIcon.ico"
    );
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      spellcheck: true, // Enable native spellchecker
    },
  });
  // En desarrollo, conecta al servidor de Vite
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(
      path.join(app.getAppPath(), "renderer/dist/index.html")
    );
  }
};

app.whenReady().then(() => {
  dbManager = new DatabaseManager();
  createWindow();
});

// IPC handlers for database operations
ipcMain.handle("db:create-trade", async (_event, tradeData) => {
  return await dbManager.createTrade(tradeData);
});

ipcMain.handle("db:get-trades", async () => {
  return await dbManager.getTrades();
});

ipcMain.handle("db:update-trade", async (_event, tradeData) => {
  return await dbManager.updateTrade(tradeData);
});
ipcMain.handle("db:delete-trade", async (_event, id) => {
  return await dbManager.deleteTrade(id);
});
ipcMain.handle("db:save-attachment", async (_event, tradeId, file) => {
  // file: { buffer: ArrayBuffer, originalName: string, mimeType: string }
  // Convertir ArrayBuffer a Buffer
  const nodeBuffer = Buffer.from(file.buffer);
  return dbManager.saveAttachment(tradeId, {
    buffer: nodeBuffer,
    originalName: file.originalName,
    mimeType: file.mimeType,
  });
});

ipcMain.handle("db:get-attachments", async (_event, tradeId) => {
  return dbManager.getAttachments(tradeId);
});

ipcMain.handle("db:read-attachment-file", async (_event, filePath) => {
  try {
    return dbManager.readAttachmentFile(filePath);
  } catch (err) {
    return null; // Or handle error as needed
  }
});

// Trading Accounts IPC handlers
ipcMain.handle("db:create-trading-account", async (_event, accountData) => {
  return await dbManager.addTradingAccount(accountData);
});

ipcMain.handle("db:get-trading-accounts", async () => {
  return await dbManager.getTradingAccounts();
});

ipcMain.handle("db:update-trading-account", async (_event, accountData) => {
  return await dbManager.updateTradingAccount(accountData);
});

ipcMain.handle("db:delete-trading-account", async (_event, id) => {
  try {
    return await dbManager.deleteTradingAccount(id);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error desconocido"
    );
  }
});

ipcMain.handle("db:get-trading-account-by-id", async (_event, id) => {
  return await dbManager.getTradingAccountById(id);
});

// Strategies IPC handlers
ipcMain.handle("db:create-strategy", async (_event, strategyData) => {
  return await dbManager.addStrategy(strategyData);
});

ipcMain.handle("db:get-strategies", async () => {
  return await dbManager.getStrategies();
});

ipcMain.handle("db:update-strategy", async (_event, strategyData) => {
  return await dbManager.updateStrategy(strategyData);
});

ipcMain.handle("db:delete-strategy", async (_event, id) => {
  try {
    return await dbManager.deleteStrategy(id);
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Error desconocido"
    );
  }
});

ipcMain.handle("db:get-strategy-by-id", async (_event, id) => {
  return await dbManager.getStrategyById(id);
});

// Add more IPC handlers as needed for attachments, settings, etc.
