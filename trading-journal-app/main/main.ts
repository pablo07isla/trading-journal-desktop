import { getAllMT5Accounts } from "./mt5-manager";
import { importMT5Data } from "./mt5-manager";

import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";
import * as fs from "fs";
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

// Handler IPC para obtener todas las cuentas MT5
ipcMain.handle("get-mt5-accounts", async () => {
  try {
    console.log("IPC get-mt5-accounts: Iniciando consulta...");
    const accounts = getAllMT5Accounts();
    console.log(
      "IPC get-mt5-accounts: Cuentas obtenidas:",
      accounts.length,
      accounts
    );
    return { success: true, data: accounts };
  } catch (error) {
    console.error("IPC get-mt5-accounts: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler IPC para actualizar cuenta MT5
ipcMain.handle(
  "update-mt5-account",
  async (_event, accountId: number, updateData: any) => {
    try {
      console.log(
        "IPC update-mt5-account: Actualizando cuenta:",
        accountId,
        updateData
      );
      const result = dbManager.updateMT5Account(accountId, updateData);
      console.log("IPC update-mt5-account: Resultado:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("IPC update-mt5-account: Error:", error);
      return {
        success: false,
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error),
      };
    }
  }
);

// Handler IPC para importar datos de MT5
ipcMain.handle("import-mt5-data", async () => {
  try {
    const result = await importMT5Data();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
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

// Handlers IPC para trades MT5 con información adicional
ipcMain.handle("update-mt5-trade", async (_event, tradeId, updateData) => {
  try {
    console.log("IPC update-mt5-trade:", { tradeId, updateData });
    await dbManager.updateMT5Trade(tradeId, updateData);
    return { success: true };
  } catch (error) {
    console.error("IPC update-mt5-trade: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

ipcMain.handle("save-mt5-trade-attachment", async (_event, tradeId, file) => {
  try {
    console.log("IPC save-mt5-trade-attachment:", { tradeId, file });
    const attachmentsDir = path.join(
      app.getPath("userData"),
      "mt5-attachments"
    );

    // Crear directorio si no existe
    if (!fs.existsSync(attachmentsDir)) {
      fs.mkdirSync(attachmentsDir, { recursive: true });
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const fileExtension = path.extname(file.originalName);
    const fileName = `mt5_trade_${tradeId}_${timestamp}${fileExtension}`;
    const filePath = path.join(attachmentsDir, fileName);

    // Escribir archivo
    const buffer = Buffer.from(file.buffer);
    fs.writeFileSync(filePath, buffer);

    // Guardar en base de datos
    await dbManager.saveMT5TradeAttachment(tradeId, filePath, file.mimeType);

    console.log("Adjunto MT5 guardado:", filePath);
    return { success: true, filePath };
  } catch (error) {
    console.error("IPC save-mt5-trade-attachment: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

ipcMain.handle("get-mt5-trade-attachments", async (_event, tradeId) => {
  try {
    console.log("IPC get-mt5-trade-attachments:", { tradeId });
    const attachments = await dbManager.getMT5TradeAttachments(tradeId);
    return { success: true, data: attachments };
  } catch (error) {
    console.error("IPC get-mt5-trade-attachments: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

ipcMain.handle("read-mt5-trade-attachment-file", async (_event, filePath) => {
  try {
    console.log("IPC read-mt5-trade-attachment-file:", { filePath });

    if (!fs.existsSync(filePath)) {
      console.log("Archivo no encontrado:", filePath);
      return null;
    }

    // Leer archivo como base64 para poder enviarlo al renderer
    const fileBuffer = fs.readFileSync(filePath);
    const base64 = fileBuffer.toString("base64");
    const mimeType =
      path.extname(filePath).toLowerCase() === ".png"
        ? "image/png"
        : path.extname(filePath).toLowerCase() === ".jpg" ||
          path.extname(filePath).toLowerCase() === ".jpeg"
        ? "image/jpeg"
        : "application/octet-stream";

    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error("Error leyendo archivo adjunto MT5:", error);
    return null;
  }
});

// Add more IPC handlers as needed for attachments, settings, etc.

// Handler IPC para borrar todos los trades MT5
ipcMain.handle("clear-all-mt5-trades", async () => {
  try {
    const result = await dbManager.clearAllMT5Trades();
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler IPC para obtener los trades de una cuenta MT5
import { getMT5AccountTrades } from "./mt5-manager";
ipcMain.handle("get-mt5-account-trades", async (_event, accountId) => {
  try {
    const trades = getMT5AccountTrades(accountId);
    return { success: true, data: trades };
  } catch (error) {
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler IPC para diagnosticar el problema de created_at
ipcMain.handle("diagnose-mt5-created-at", async () => {
  try {
    console.log("IPC diagnose-mt5-created-at: Iniciando diagnóstico...");
    dbManager.diagnoseMT5CreatedAtIssue();
    return {
      success: true,
      message: "Diagnóstico completado. Revisa la consola.",
    };
  } catch (error) {
    console.error("IPC diagnose-mt5-created-at: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler IPC para forzar actualización de created_at
ipcMain.handle("force-update-mt5-created-at", async () => {
  try {
    console.log(
      "IPC force-update-mt5-created-at: Iniciando actualización forzada..."
    );
    const result = dbManager.forceUpdateMT5AccountsCreatedAt();
    console.log("IPC force-update-mt5-created-at: Resultado:", result);
    return { success: true, data: result };
  } catch (error) {
    console.error("IPC force-update-mt5-created-at: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// ============ TRADING PLANS IPC HANDLERS ============

// Handler para crear un plan de trading
ipcMain.handle("db:create-trading-plan", async (_event, planData) => {
  try {
    console.log("IPC create-trading-plan:", planData);
    const result = await dbManager.createTradingPlan(planData);
    return { success: true, data: result };
  } catch (error) {
    console.error("IPC create-trading-plan: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler para obtener todos los planes de trading
ipcMain.handle("db:get-trading-plans", async () => {
  try {
    console.log("IPC get-trading-plans: Consultando planes...");
    const plans = await dbManager.getTradingPlans();
    return { success: true, data: plans };
  } catch (error) {
    console.error("IPC get-trading-plans: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler para obtener un plan específico por ID
ipcMain.handle("db:get-trading-plan-by-id", async (_event, id) => {
  try {
    console.log("IPC get-trading-plan-by-id:", id);
    const plan = await dbManager.getTradingPlanById(id);
    return { success: true, data: plan };
  } catch (error) {
    console.error("IPC get-trading-plan-by-id: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler para actualizar un plan de trading
ipcMain.handle("db:update-trading-plan", async (_event, planData) => {
  try {
    console.log("IPC update-trading-plan:", planData);
    const result = await dbManager.updateTradingPlan(planData);
    return { success: true, data: result };
  } catch (error) {
    console.error("IPC update-trading-plan: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler para eliminar un plan de trading
ipcMain.handle("db:delete-trading-plan", async (_event, id) => {
  try {
    console.log("IPC delete-trading-plan:", id);
    const result = await dbManager.deleteTradingPlan(id);
    return { success: true, data: result };
  } catch (error) {
    console.error("IPC delete-trading-plan: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler para obtener planes activos solamente
ipcMain.handle("db:get-active-trading-plans", async () => {
  try {
    console.log("IPC get-active-trading-plans: Consultando planes activos...");
    const plans = await dbManager.getActiveTradingPlans();
    return { success: true, data: plans };
  } catch (error) {
    console.error("IPC get-active-trading-plans: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});

// Handler para validar un trade contra las reglas de un plan
ipcMain.handle(
  "db:validate-trade-against-plan",
  async (_event, planId, tradeData) => {
    try {
      console.log("IPC validate-trade-against-plan:", { planId, tradeData });
      const validation = await dbManager.validateTradeAgainstPlan(
        planId,
        tradeData
      );
      return { success: true, data: validation };
    } catch (error) {
      console.error("IPC validate-trade-against-plan: Error:", error);
      return {
        success: false,
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as { message: string }).message
            : String(error),
      };
    }
  }
);

// Handler para obtener progreso de un plan
ipcMain.handle("db:get-plan-progress", async (_event, planId) => {
  try {
    console.log("IPC get-plan-progress:", planId);
    const progress = await dbManager.getPlanProgress(planId);
    return { success: true, data: progress };
  } catch (error) {
    console.error("IPC get-plan-progress: Error:", error);
    return {
      success: false,
      error:
        typeof error === "object" && error !== null && "message" in error
          ? (error as { message: string }).message
          : String(error),
    };
  }
});
