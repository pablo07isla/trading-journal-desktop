import { useState, useEffect, useCallback } from "react";
import type {
  MT5TradeData,
  MT5AccountData,
  MT5TradesMetrics,
  MT5PnLDistributionItem,
  MT5MetricsBySymbol,
  MT5MetricsByAccount,
  MT5EquityCurveItem,
  MT5TradeFilters,
  MT5MetricFilters,
} from "../types/mt5";

// Hook para manejar datos MT5
export const useMT5Data = () => {
  // Estados para datos
  const [trades, setTrades] = useState<MT5TradeData[]>([]);
  const [accounts, setAccounts] = useState<MT5AccountData[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Función para obtener trades con filtros
  const fetchTrades = useCallback(async (filters?: MT5TradeFilters) => {
    setLoading(true);
    setError(null);

    try {
      const response = await window.electronAPI.getMT5TradesWithFilters(
        filters
      );

      if (response.success && response.data) {
        setTrades(response.data);
      } else {
        throw new Error(response.error || "Error obteniendo trades MT5");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error en fetchTrades:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para obtener métricas
  const fetchMetrics = useCallback(
    async (filters?: MT5MetricFilters): Promise<MT5TradesMetrics | null> => {
      try {
        const response = await window.electronAPI.getMT5TradesMetrics(filters);

        if (response.success && response.data) {
          return response.data as MT5TradesMetrics;
        } else {
          throw new Error(response.error || "Error obteniendo métricas MT5");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error en fetchMetrics:", err);
        return null;
      }
    },
    []
  );

  // Función para obtener distribución P&L
  const fetchPnLDistribution = useCallback(
    async (filters?: MT5MetricFilters): Promise<MT5PnLDistributionItem[]> => {
      try {
        const response = await window.electronAPI.getMT5PnLDistribution(
          filters
        );

        if (response.success && response.data) {
          return response.data as MT5PnLDistributionItem[];
        } else {
          throw new Error(
            response.error || "Error obteniendo distribución P&L"
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error en fetchPnLDistribution:", err);
        return [];
      }
    },
    []
  );

  // Función para obtener datos de equity curve
  const fetchEquityCurve = useCallback(
    async (filters?: MT5MetricFilters): Promise<MT5EquityCurveItem[]> => {
      try {
        const response = await window.electronAPI.getMT5EquityCurve(filters);

        if (response.success && response.data) {
          return response.data as MT5EquityCurveItem[];
        } else {
          throw new Error(response.error || "Error obteniendo equity curve");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error en fetchEquityCurve:", err);
        return [];
      }
    },
    []
  );

  // Función para obtener métricas por símbolo
  const fetchMetricsBySymbol = useCallback(
    async (filters?: MT5MetricFilters): Promise<MT5MetricsBySymbol[]> => {
      try {
        const response = await window.electronAPI.getMT5MetricsBySymbol(
          filters
        );

        if (response.success && response.data) {
          return response.data as MT5MetricsBySymbol[];
        } else {
          throw new Error(
            response.error || "Error obteniendo métricas por símbolo"
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error en fetchMetricsBySymbol:", err);
        return [];
      }
    },
    []
  );

  // Función para obtener métricas por cuenta
  const fetchMetricsByAccount = useCallback(
    async (filters?: MT5MetricFilters): Promise<MT5MetricsByAccount[]> => {
      try {
        const response = await window.electronAPI.getMT5MetricsByAccount(
          filters
        );

        if (response.success && response.data) {
          return response.data as MT5MetricsByAccount[];
        } else {
          throw new Error(
            response.error || "Error obteniendo métricas por cuenta"
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        console.error("Error en fetchMetricsByAccount:", err);
        return [];
      }
    },
    []
  );

  // Función para obtener cuentas MT5
  const fetchAccounts = useCallback(async () => {
    try {
      const response = await window.electronAPI.getMT5AccountsFromDB();

      if (response.success && response.data) {
        setAccounts(response.data);
      } else {
        throw new Error(response.error || "Error obteniendo cuentas MT5");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error en fetchAccounts:", err);
    }
  }, []);

  // Función para obtener símbolos únicos
  const fetchSymbols = useCallback(async () => {
    try {
      const response = await window.electronAPI.getMT5UniqueSymbols();

      if (response.success && response.data) {
        setSymbols(response.data);
      } else {
        throw new Error(response.error || "Error obteniendo símbolos");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      console.error("Error en fetchSymbols:", err);
    }
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    fetchAccounts();
    fetchSymbols();
  }, [fetchAccounts, fetchSymbols]);

  // Función para calcular métricas adicionales en el cliente
  const calculateAdvancedMetrics = useCallback(
    (
      trades: MT5TradeData[]
    ): {
      winRate: number;
      profitFactor: number;
      expectancy: number;
      maxDrawdown: number;
      recoveryFactor: number;
      sharpeRatio: number;
    } => {
      if (trades.length === 0) {
        return {
          winRate: 0,
          profitFactor: 0,
          expectancy: 0,
          maxDrawdown: 0,
          recoveryFactor: 0,
          sharpeRatio: 0,
        };
      }

      const closedTrades = trades.filter((t) => t.close_time);
      const winTrades = closedTrades.filter(
        (t) => t.profit + t.commission + t.swap > 0
      );
      const loseTrades = closedTrades.filter(
        (t) => t.profit + t.commission + t.swap < 0
      );

      // Win Rate
      const winRate =
        closedTrades.length > 0
          ? (winTrades.length / closedTrades.length) * 100
          : 0;

      // Profit Factor
      const grossProfit = winTrades.reduce(
        (sum, t) => sum + (t.profit + t.commission + t.swap),
        0
      );
      const grossLoss = Math.abs(
        loseTrades.reduce(
          (sum, t) => sum + (t.profit + t.commission + t.swap),
          0
        )
      );
      const profitFactor =
        grossLoss > 0
          ? grossProfit / grossLoss
          : grossProfit > 0
          ? Infinity
          : 0;

      // Expectancy
      const totalPnL = closedTrades.reduce(
        (sum, t) => sum + (t.profit + t.commission + t.swap),
        0
      );
      const expectancy =
        closedTrades.length > 0 ? totalPnL / closedTrades.length : 0;

      // Calcular drawdown máximo
      let equity = 0;
      let maxEquity = 0;
      let maxDrawdown = 0;

      const sortedTrades = [...closedTrades].sort(
        (a, b) =>
          new Date(a.open_time).getTime() - new Date(b.open_time).getTime()
      );

      sortedTrades.forEach((trade) => {
        equity += trade.profit + trade.commission + trade.swap;
        if (equity > maxEquity) {
          maxEquity = equity;
        }
        const drawdown = ((maxEquity - equity) / Math.max(maxEquity, 1)) * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      });

      // Recovery Factor
      const recoveryFactor = maxDrawdown > 0 ? totalPnL / maxDrawdown : 0;

      // Sharpe Ratio simplificado (usando desviación estándar de returns)
      const returns = closedTrades.map((t) => t.profit + t.commission + t.swap);
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance =
        returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) /
        returns.length;
      const stdDev = Math.sqrt(variance);
      const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;

      return {
        winRate,
        profitFactor,
        expectancy,
        maxDrawdown,
        recoveryFactor,
        sharpeRatio,
      };
    },
    []
  );

  return {
    // Estados
    trades,
    accounts,
    symbols,
    loading,
    error,

    // Funciones de fetch
    fetchTrades,
    fetchMetrics,
    fetchPnLDistribution,
    fetchEquityCurve,
    fetchMetricsBySymbol,
    fetchMetricsByAccount,
    fetchAccounts,
    fetchSymbols,

    // Utilidades
    calculateAdvancedMetrics,
  };
};

export default useMT5Data;
