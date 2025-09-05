import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { DatabaseManager, MT5TradeInsertData } from "./database/db-manager";

// Interfaces para datos de MT5
interface MT5AccountResponse {
  login: number;
  name: string;
  company: string;
  currency: string;
  balance: number;
  equity: number;
  margin: number;
  free_margin: number;
  leverage: number;
  profit: number;
  server: string;
}

interface MT5TradeResponse {
  position_id: number;
  entry: number;
  ticket: number;
  order: number;
  symbol: string;
  volume: number;
  price: number;
  commission: number;
  swap: number;
  profit: number;
  time: number;
  type: number; // 0=BUY, 1=SELL, 2=BALANCE
  comment: string;
  magic: number;
  sl?: number;
  tp?: number;
}

interface MT5ImportResult {
  account: MT5AccountResponse;
  trades: MT5TradeInsertData[];
  summary: {
    accountsImported: number;
    tradesImported: number;
    tradesSkipped: number;
    errors: string[];
  };
}

// Detectar el ejecutable de Python disponible
function getPythonExecutable(): string {
  const possiblePaths = [
    "python",
    "python3",
    "py",
    "C:\\Python39\\python.exe",
    "C:\\Python310\\python.exe",
    "C:\\Python311\\python.exe",
    "C:\\Python312\\python.exe",
  ];

  // En desarrollo, podría estar en el venv
  if (process.env.NODE_ENV === "development") {
    possiblePaths.unshift(
      path.join(process.cwd(), ".venv", "Scripts", "python.exe")
    );
  }

  return possiblePaths[0]; // Por ahora usamos el primero, podríamos verificar cuál funciona
}

const pythonExecutable = getPythonExecutable();
const mt5ScriptPath = path.join(__dirname, "mt5-integration", "mt5_fetch.py");

// Función para verificar si Python y las dependencias están disponibles
async function checkPythonSetup(): Promise<{
  available: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    // Primero verificar si Python está disponible
    const proc = spawn(
      pythonExecutable,
      ["-c", "import MetaTrader5; import numpy; print('OK')"],
      {
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      if (code === 0 && output.trim() === "OK") {
        resolve({ available: true });
      } else {
        resolve({
          available: false,
          error: `Python setup check failed. Code: ${code}. Error: ${errorOutput}`,
        });
      }
    });

    proc.on("error", (err) => {
      resolve({
        available: false,
        error: `Failed to run Python: ${err.message}`,
      });
    });
  });
}

// Función para ejecutar el script de Python
function executePythonScript(args: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log(
      `Executing: ${pythonExecutable} ${mt5ScriptPath} ${args.join(" ")}`
    );

    const proc = spawn(pythonExecutable, [mt5ScriptPath, ...args], {
      stdio: ["pipe", "pipe", "pipe"],
      cwd: path.dirname(mt5ScriptPath),
    });

    let output = "";
    let errorOutput = "";

    proc.stdout.on("data", (data) => {
      output += data.toString();
    });

    proc.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    proc.on("close", (code) => {
      console.log(`Python script finished with code: ${code}`);
      console.log(`Output: ${output}`);
      if (errorOutput) console.log(`Error output: ${errorOutput}`);

      if (code === 0) {
        try {
          const result = JSON.parse(output.trim());
          resolve(result);
        } catch (err) {
          reject(
            new Error(
              `Failed to parse JSON output: ${err}. Raw output: ${output}`
            )
          );
        }
      } else {
        reject(
          new Error(
            `Python script failed with code ${code}. Error: ${errorOutput}`
          )
        );
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to start Python script: ${err.message}`));
    });
  });
}

// Función para convertir trade de MT5 a formato de base de datos (comentada - no se usa actualmente)
// function convertMT5TradeToDBFormat(
//   trade: MT5TradeResponse,
//   accountId: number
//   ): MT5TradeInsertData {
//   return {
//     account_id: accountId,
//     position_id: trade.position_id,
//     symbol: trade.symbol,
//     trade_type: trade.type === 0 ? "BUY" : "SELL",
//     volume: trade.volume,
//     open_time: new Date(trade.time * 1000).toISOString(),
//     open_price: trade.price,
//     close_time: undefined,
//     close_price: undefined,
//     profit: trade.profit,
//     commission: trade.commission,
//     swap: trade.swap,
//     magic_number: trade.magic,
//     comment: trade.comment,
//   };
// }

// Obtener todas las cuentas MT5 guardadas
export function getAllMT5Accounts() {
  const db = new DatabaseManager();
  try {
    return db.getMT5Accounts();
  } finally {
    db.close();
  }
}

// Obtener trades de una cuenta específica
export function getMT5AccountTrades(accountId: number) {
  const db = new DatabaseManager();
  try {
    return db.getMT5Trades(accountId);
  } finally {
    db.close();
  }
}

// Obtener estadísticas de una cuenta
export function getMT5AccountStatistics(accountId: number) {
  const db = new DatabaseManager();
  try {
    return db.getMT5AccountStats(accountId);
  } finally {
    db.close();
  }
}

// Función principal de importación actualizada
export async function importMT5Data(): Promise<MT5ImportResult> {
  const db = new DatabaseManager();
  let accountsImported = 0;
  let tradesImported = 0;
  let tradesSkipped = 0;
  const errors: string[] = [];

  try {
    // Verificar que el script existe
    if (!fs.existsSync(mt5ScriptPath)) {
      throw new Error(`MT5 Python script not found at: ${mt5ScriptPath}`);
    }

    // Verificar que Python y las dependencias están disponibles
    const pythonCheck = await checkPythonSetup();
    if (!pythonCheck.available) {
      throw new Error(`Python setup error: ${pythonCheck.error}`);
    }

    console.log(`Using Python script at: ${mt5ScriptPath}`);

    // Importar datos de cuenta y trades en paralelo
    const [accountResponse, tradesResponse] = await Promise.all([
      executePythonScript(["account"]),
      executePythonScript(["trades"]),
    ]);

    let account: MT5AccountResponse | null = null;
    let trades: MT5TradeInsertData[] = [];

    // Procesar respuesta de cuenta
    if (accountResponse) {
      account = accountResponse;

      // Determinar balance inicial desde trades de depósito
      const initialDeposit = tradesResponse?.find(
        (trade: MT5TradeResponse) =>
          (trade.comment?.toUpperCase().includes("DEPOSIT") ||
            trade.comment?.toUpperCase().includes("INITIAL") ||
            trade.type === 2) &&
          trade.profit > 0
      );

      const createDate = tradesResponse?.find(
        (trade: MT5TradeResponse) =>
          (trade.comment?.toUpperCase().includes("DEPOSIT") ||
            trade.comment?.toUpperCase().includes("INITIAL") ||
            trade.type === 2) &&
          trade.profit > 0
      );

      const initialBalance = initialDeposit
        ? initialDeposit.profit
        : account?.balance ?? 0;
      const currentBalance = account ? account.balance : 0;
      const pnl = currentBalance - initialBalance;

      // Verificar si la cuenta ya existe para preservar el tipo editado manualmente
      const existingAccounts = db.getMT5Accounts();
      const existingAccount = existingAccounts.find(
        (existing) => existing.account_id === account!.login
      );

      // Si la cuenta existe, mantener el tipo actual; si no, guardar como null para clasificación manual
      const accountType = existingAccount?.type || null;

      const createdAt = createDate
        ? new Date(createDate.time * 1000).toISOString()
        : new Date().toISOString();

      if (account) {
        console.log("importMT5Data: Guardando cuenta MT5 en base de datos:", {
          login: account.login,
          name: account.name,
          company: account.company,
          currency: account.currency,
          type: accountType,
          initialBalance,
          currentBalance,
          pnl,
          createdAt,
        });

        try {
          // La verificación de existencia ya se hizo arriba para preservar el tipo
          if (existingAccount) {
            console.log(
              `Cuenta ${
                account!.login
              } ya existe, actualizando información (preservando tipo: ${
                accountType || "Sin clasificar"
              })...`
            );
          } else {
            console.log(
              `Creando nueva cuenta ${
                account!.login
              } sin tipo asignado (se puede clasificar manualmente)...`
            );
          }

          db.addMT5Account({
            login: account.login,
            name: account.name,
            company: account.company,
            currency: account.currency,
            type: accountType,
            initial_balance: initialBalance,
            current_balance: currentBalance,
            pnl: pnl,
            created_at: createdAt,
          });
          accountsImported = 1;
        } catch (error) {
          const errorMsg = `Error guardando cuenta: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      } else {
        const errorMsg = "No se recibió información de cuenta de MT5.";
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    // Procesar trades
    if (Array.isArray(tradesResponse)) {
      // Filtrar trades de balance/depósito que no son trades reales
      const actualTrades = tradesResponse.filter(
        (trade: MT5TradeResponse) => trade.type !== 2 && trade.symbol !== ""
      );
      console.log(
        `Procesando ${actualTrades.length} trades reales de ${tradesResponse.length} totales`
      );

      // Agrupar trades por ticket/position_id
      const groupedTrades: { [key: string]: MT5TradeResponse[] } = {};
      actualTrades.forEach((trade: MT5TradeResponse) => {
        const posId = trade.position_id;
        if (!groupedTrades[posId]) {
          groupedTrades[posId] = [];
        }
        groupedTrades[posId].push(trade);
      });

      console.log(
        `Agrupados en ${
          Object.keys(groupedTrades).length
        } posiciones por position_id`
      );
      const completedPositions: MT5TradeInsertData[] = [];

      Object.values(groupedTrades).forEach((positionTrades) => {
        const openTrade = positionTrades.find((t) => t.entry === 0);
        const closeTrade = positionTrades.find((t) => t.entry === 1);

        if (openTrade && closeTrade && account) {
          completedPositions.push({
            account_id: account.login,
            position_id: openTrade.position_id,
            symbol: openTrade.symbol,
            trade_type: openTrade.type === 0 ? "BUY" : "SELL",
            volume: openTrade.volume,
            open_time: new Date(openTrade.time * 1000).toISOString(),
            open_price: openTrade.price,
            close_time: new Date(closeTrade.time * 1000).toISOString(),
            close_price: closeTrade.price,
            profit: closeTrade.profit,
            commission: openTrade.commission + closeTrade.commission,
            swap: closeTrade.swap,
            magic_number: openTrade.magic,
            comment: closeTrade.comment,
          });
        }
      });

      // Guardar solo los trades agrupados (completedPositions)
      for (const dbTrade of completedPositions) {
        try {
          // Verificar si el trade ya existe
          const existingTrades = db.getMT5Trades(dbTrade.account_id);
          const tradeExists = existingTrades.some(
            (existing) =>
              existing.position_id.toString() ===
                dbTrade.position_id.toString() &&
              existing.account_id === dbTrade.account_id
          );

          if (tradeExists) {
            console.log(`Trade ${dbTrade.position_id} ya existe, saltando...`);
            tradesSkipped++;
            continue;
          }

          db.addMT5Trade(dbTrade);
          tradesImported++;
        } catch (error) {
          const errorMsg = `Error guardando trade agrupado ${dbTrade.position_id}: ${error}`;
          console.error(errorMsg);
          errors.push(errorMsg);
          tradesSkipped++;
        }
      }

      // Para la respuesta, solo devolver los trades agrupados
      trades = completedPositions;
    }

    const summary = {
      accountsImported,
      tradesImported,
      tradesSkipped,
      errors,
    };

    console.log("Importación completada:", summary);

    return {
      account: account!,
      trades,
      summary,
    };
  } catch (error) {
    console.error("Error in importMT5Data:", error);
    errors.push(`Error general: ${error}`);

    // Retornar resultado parcial en caso de error
    return {
      account: {} as MT5AccountResponse,
      trades: [],
      summary: {
        accountsImported,
        tradesImported,
        tradesSkipped,
        errors,
      },
    };
  } finally {
    db.close();
  }
}

// Función para sincronizar datos (actualizar trades existentes y agregar nuevos)
export async function syncMT5Data(accountId?: number): Promise<{
  success: boolean;
  message: string;
  summary?: {
    tradesUpdated: number;
    tradesAdded: number;
    errors: string[];
  };
}> {
  const db = new DatabaseManager();
  const errors: string[] = [];
  let tradesUpdated = 0;
  let tradesAdded = 0;

  try {
    // Obtener datos actuales de MT5
    const tradesResponse = await executePythonScript(["trades"]);

    if (!Array.isArray(tradesResponse)) {
      return {
        success: false,
        message: "No se pudieron obtener trades de MT5",
      };
    }

    // Si se especifica accountId, solo sincronizar esa cuenta
    let targetAccountId: number;
    if (accountId) {
      targetAccountId = accountId;
    } else {
      // Obtener la primera cuenta disponible
      const accounts = db.getMT5Accounts();
      if (accounts.length === 0) {
        return {
          success: false,
          message:
            "No hay cuentas MT5 configuradas. Ejecuta importación completa primero.",
        };
      }
      targetAccountId = accounts[0].account_id;
    }

    // Obtener trades existentes
    const existingTrades = db.getMT5Trades(targetAccountId);
    const existingPositionIds = new Set(
      existingTrades.map((t) => t.position_id.toString())
    );

    // // Procesar trades de MT5
    // for (const trade of tradesResponse) {
    //   if (trade.type !== 0 && trade.type !== 1) continue; // Solo BUY/SELL

    //   try {
    //     const positionId = trade.ticket.toString();

    //     if (existingPositionIds.has(positionId)) {
    //       // Actualizar trade existente (puede haberse cerrado)
    //       const dbTrade = convertMT5TradeToDBFormat(trade, targetAccountId);
    //       const existingTrade = existingTrades.find(
    //         (t) => t.position_id.toString() === positionId
    //       );

    //       if (existingTrade) {
    //         db.updateMT5Trade(existingTrade.trade_id!, {
    //           profit: dbTrade.profit,
    //           commission: dbTrade.commission,
    //           swap: dbTrade.swap,
    //           // Si el trade tiene profit/loss final, marcarlo como cerrado
    //           close_time:
    //             Math.abs(dbTrade.profit) > 0.01
    //               ? new Date().toISOString()
    //               : undefined,
    //           close_price:
    //             Math.abs(dbTrade.profit) > 0.01
    //               ? dbTrade.open_price +
    //                 dbTrade.profit / (dbTrade.volume * 100000)
    //               : undefined,
    //         });
    //         tradesUpdated++;
    //       }
    //     } else {
    //       // Agregar nuevo trade
    //       const dbTrade = convertMT5TradeToDBFormat(trade, targetAccountId);
    //       db.addMT5Trade(dbTrade);
    //       tradesAdded++;
    //     }
    //   } catch (error) {
    //     const errorMsg = `Error sincronizando trade ${trade.ticket}: ${error}`;
    //     errors.push(errorMsg);
    //     console.error(errorMsg);
    //   }
    // }

    const summary = {
      tradesUpdated,
      tradesAdded,
      errors,
    };

    return {
      success: true,
      message: `Sincronización completada: ${tradesAdded} nuevos, ${tradesUpdated} actualizados`,
      summary,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error en sincronización: ${error}`,
    };
  } finally {
    db.close();
  }
}

export class MT5Manager {
  static async testConnection(): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      const pythonCheck = await checkPythonSetup();
      if (!pythonCheck.available) {
        return {
          success: false,
          message: `Python setup error: ${pythonCheck.error}`,
        };
      }

      // Test adicional: intentar obtener información de cuenta
      try {
        const accountInfo = await executePythonScript(["account"]);
        return {
          success: true,
          message: "Conexión MT5 exitosa",
          details: {
            account: accountInfo?.login,
            server: accountInfo?.server,
            company: accountInfo?.company,
          },
        };
      } catch (error) {
        return {
          success: false,
          message: `MT5 no disponible: ${error}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Test de conexión falló: ${error}`,
      };
    }
  }

  static async getAccountInfo(): Promise<MT5AccountResponse | null> {
    try {
      const pythonCheck = await checkPythonSetup();
      if (!pythonCheck.available) {
        throw new Error("Python/MT5 no disponible");
      }

      return await executePythonScript(["account"]);
    } catch (error) {
      console.error("Error obteniendo info de cuenta:", error);
      return null;
    }
  }

  static async getCurrentTrades(): Promise<MT5TradeResponse[]> {
    try {
      const pythonCheck = await checkPythonSetup();
      if (!pythonCheck.available) {
        throw new Error("Python/MT5 no disponible");
      }

      const trades = await executePythonScript(["trades"]);
      return Array.isArray(trades) ? trades : [];
    } catch (error) {
      console.error("Error obteniendo trades actuales:", error);
      return [];
    }
  }
}
