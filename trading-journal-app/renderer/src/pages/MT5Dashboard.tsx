import React, { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Activity,
  Target,
  BarChart3,
} from "lucide-react";

// Importar tipos MT5 y hook personalizado
import type {
  MT5TradesMetrics,
  MT5MetricFilters,
  MT5PnLDistributionItem,
  MT5EquityCurveItem,
} from "@/types/mt5";
import { useMT5Data } from "@/hooks/useMT5Data";
import PnLDistributionChart from "@/components/charts/PnLDistributionChart";
import EquityCurveChart from "@/components/charts/EquityCurveChart";

const MT5Dashboard: React.FC = () => {
  // Estados para filtros
  const [period, setPeriod] = useState("year");
  const [account, setAccount] = useState("all");
  const [symbol, setSymbol] = useState("all");

  // Estados para datos
  const [metrics, setMetrics] = useState<MT5TradesMetrics | null>(null);
  const [pnlDistribution, setPnlDistribution] = useState<
    MT5PnLDistributionItem[]
  >([]);
  const [equityCurve, setEquityCurve] = useState<MT5EquityCurveItem[]>([]);

  // Hook personalizado para datos MT5
  const {
    trades,
    accounts,
    symbols,
    loading,
    error,
    fetchTrades,
    fetchMetrics,
    fetchPnLDistribution,
    fetchEquityCurve,
    fetchAccounts,
    calculateAdvancedMetrics,
  } = useMT5Data();

  // Escuchar eventos de actualización de cuentas MT5
  useEffect(() => {
    const handleAccountsUpdated = () => {
      console.log("MT5Dashboard: Recibido evento de actualización de cuentas");
      fetchAccounts(); // Recargar cuentas cuando se actualicen
    };

    window.addEventListener("mt5AccountsUpdated", handleAccountsUpdated);

    return () => {
      window.removeEventListener("mt5AccountsUpdated", handleAccountsUpdated);
    };
  }, [fetchAccounts]);

  // Preparar filtros basados en el estado actual
  const filters = useMemo((): MT5MetricFilters => {
    const now = new Date();
    let fromDate: Date;

    if (period === "7days") {
      fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === "month") {
      fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (period === "year") {
      fromDate = new Date(now.getFullYear(), 0, 1);
    } else {
      fromDate = new Date(0); // all time
    }

    return {
      accountId: account !== "all" ? parseInt(account) : undefined,
      symbol: symbol !== "all" ? symbol : undefined,
      dateFrom: fromDate.toISOString(),
      dateTo: now.toISOString(),
    };
  }, [period, account, symbol]);

  // Efecto para cargar trades y métricas cuando cambien los filtros
  useEffect(() => {
    const loadData = async () => {
      // Cargar trades con filtros
      await fetchTrades({
        ...filters,
        onlyClosedTrades: true, // Solo trades cerrados para métricas
      });

      // Cargar métricas
      const metricsData = await fetchMetrics(filters);
      setMetrics(metricsData);

      // Cargar distribución P&L
      const distributionData = await fetchPnLDistribution(filters);
      setPnlDistribution(distributionData);

      // Cargar equity curve
      const equityData = await fetchEquityCurve(filters);
      setEquityCurve(equityData);
    };

    loadData();
  }, [
    filters,
    fetchTrades,
    fetchMetrics,
    fetchPnLDistribution,
    fetchEquityCurve,
  ]);

  // Calcular métricas avanzadas
  const advancedMetrics = useMemo(
    () => calculateAdvancedMetrics(trades),
    [trades, calculateAdvancedMetrics]
  );

  // Obtener balance inicial para cálculo de porcentaje
  const getInitialBalance = () => {
    if (account !== "all") {
      const accountData = accounts.find(
        (acc) => acc.account_id.toString() === account
      );
      return accountData?.initial_balance || 0;
    } else {
      // Sumar balance inicial de todas las cuentas
      return accounts.reduce((sum, acc) => sum + acc.initial_balance, 0);
    }
  };

  const initialBalance = getInitialBalance();

  // Obtener configuración de risk management de la cuenta seleccionada
  const getRiskSettings = () => {
    if (account !== "all") {
      const accountData = accounts.find(
        (acc) => acc.account_id.toString() === account
      );

      console.log("MT5Dashboard getRiskSettings Debug:", {
        account,
        accountData,
        found: !!accountData,
        riskSettings: accountData
          ? {
              profitTarget: accountData.profit_target_percent,
              stopTarget: accountData.stop_target_percent,
              dailyLoss: accountData.daily_loss_percent,
            }
          : null,
      });

      return {
        profitTargetPercent: accountData?.profit_target_percent,
        stopTargetPercent: accountData?.stop_target_percent,
        dailyLossPercent: accountData?.daily_loss_percent,
      };
    }

    console.log(
      "MT5Dashboard getRiskSettings Debug - Account is 'all', returning undefined values"
    );
    return {
      profitTargetPercent: undefined,
      stopTargetPercent: undefined,
      dailyLossPercent: undefined,
    };
  };

  const riskSettings = getRiskSettings();

  // Debug adicional para verificar qué se pasa al componente
  console.log("MT5Dashboard riskSettings final:", riskSettings);

  // Preparar datos de KPIs mejorados
  const kpiData = useMemo(() => {
    if (!metrics) {
      return [
        {
          title: "P&L Total",
          value: "$0.00",
          trend: "up",
          change: "0.0%",
          subtitle: "Ganancia/Pérdida acumulada",
          description: "No hay datos disponibles",
          icon: TrendingUp,
        },
        {
          title: "Operaciones",
          value: 0,
          trend: "up",
          change: "",
          subtitle: "Cantidad de trades",
          description: "Total en el período",
          icon: Users,
        },
        {
          title: "Win Rate",
          value: "0.0%",
          trend: "up",
          change: "",
          subtitle: "Porcentaje de trades ganadores",
          description: "Win rate sobre el total",
          icon: Activity,
        },
        {
          title: "Trade Promedio",
          value: "$0.00",
          trend: "up",
          change: "",
          subtitle: "Ganancia/Pérdida promedio",
          description: "Promedio por trade",
          icon: Target,
        },
      ];
    }

    const totalPL = metrics.netPnL;
    const changePercent =
      initialBalance > 0
        ? ((totalPL / initialBalance) * 100).toFixed(1)
        : "0.0";

    // Usar cálculos consistentes del hook para Win Rate y Profit Factor
    const winRate = advancedMetrics.winRate.toFixed(1);
    const profitFactor = advancedMetrics.profitFactor;
    const avgTrade = metrics.avgProfit;

    return [
      {
        title: "P&L Neto",
        value: `$${totalPL.toFixed(2)}`,
        trend: totalPL >= 0 ? "up" : "down",
        change: `${changePercent} %`,
        subtitle: "Ganancia/Pérdida neta",
        description:
          initialBalance > 0
            ? `Cambio sobre balance inicial${
                account !== "all" ? " de la cuenta" : " de todas las cuentas"
              }`
            : "Balance inicial no disponible",
        icon: TrendingUp,
      },
      {
        title: "Operaciones",
        value: metrics.closedTrades,
        trend: "up",
        change: ``,
        subtitle: "Trades cerrados",
        description: `${metrics.totalTrades} total `,
        icon: Users,
      },
      {
        title: "Win Rate",
        value: `${winRate}%`,
        trend: parseFloat(winRate) >= 50 ? "up" : "down",
        change: `${profitFactor.toFixed(2)} pf`,
        subtitle: "Porcentaje de trades ganadores",
        description: `Profit Factor: ${profitFactor.toFixed(2)}`,
        icon: Activity,
      },
      {
        title: "Trade Promedio",
        value: `$${advancedMetrics.expectancy.toFixed(2)}`,
        trend: avgTrade >= 0 ? "up" : "down",
        change: ``,
        subtitle: "Ganancia/Pérdida promedio",
        description: ``,
        icon: Target,
      },
    ];
  }, [metrics, initialBalance, account, advancedMetrics]);

  // Métricas adicionales
  const additionalMetrics = useMemo(
    () => [
      {
        title: "Max Drawdown",
        value: `${advancedMetrics.maxDrawdown.toFixed(2)}%`,
        trend: advancedMetrics.maxDrawdown <= 10 ? "up" : "down",
        subtitle: "Máximo drawdown",
        icon: TrendingDown,
      },
      {
        title: "Recovery Factor",
        value: advancedMetrics.recoveryFactor.toFixed(2),
        trend: advancedMetrics.recoveryFactor >= 2 ? "up" : "down",
        subtitle: "Factor de recuperación",
        icon: Target,
      },
      {
        title: "Sharpe Ratio",
        value: advancedMetrics.sharpeRatio.toFixed(2),
        trend: advancedMetrics.sharpeRatio >= 1 ? "up" : "down",
        subtitle: "Ratio risk-adjusted",
        icon: BarChart3,
      },
    ],
    [advancedMetrics]
  );

  return (
    <div className='w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 space-y-6 bg-background min-h-screen overflow-x-auto'>
      <div className='flex flex-col gap-4'>
        <h1 className='text-2xl font-bold'>Dashboard MT5</h1>

        {/* Filtros */}
        <div className='flex flex-wrap gap-4'>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='Período' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7days'>7 días</SelectItem>
              <SelectItem value='month'>Este mes</SelectItem>
              <SelectItem value='year'>Este año</SelectItem>
              <SelectItem value='all'>Todo</SelectItem>
            </SelectContent>
          </Select>

          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className='w-48'>
              <SelectValue placeholder='Cuenta' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todas las cuentas</SelectItem>
              {accounts.map((acc) => (
                <SelectItem
                  key={acc.account_id}
                  value={acc.account_id.toString()}>
                  {acc.account_name || `Cuenta ${acc.account_id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='Símbolo' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Todos</SelectItem>
              {symbols.map((sym) => (
                <SelectItem key={sym} value={sym}>
                  {sym}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mostrar loading/error */}
        {loading && (
          <div className='text-center py-4'>
            <p>Cargando datos MT5...</p>
          </div>
        )}

        {error && (
          <div className='text-center py-4 text-destructive'>
            <p>Error: {error}</p>
          </div>
        )}
      </div>

      {/* KPIs Principales */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>{kpi.title}</CardTitle>
              <div
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                  kpi.trend === "up"
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                }`}>
                {kpi.trend === "up" ? (
                  <TrendingUp className='h-4 w-4' />
                ) : (
                  <TrendingDown className='h-4 w-4' />
                )}
                {kpi.change}
              </div>
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{kpi.value}</div>
              {/* <p className='text-xs text-muted-foreground mt-1'>
                {kpi.change && (
                  <span className='text-green-600'>{kpi.change}</span>
                )}
              </p> */}
              <p className='text-xs text-muted-foreground mt-2'>
                {kpi.subtitle}
              </p>
              <p className='text-xs text-muted-foreground'>{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Métricas Adicionales */}
      <div className='grid gap-4 md:grid-cols-3'>
        {additionalMetrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {metric.title}
              </CardTitle>
              <metric.icon
                className={`h-4 w-4 ${
                  metric.trend === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }`}
              />
            </CardHeader>
            <CardContent>
              <div className='text-xl font-bold'>{metric.value}</div>
              <p className='text-xs text-muted-foreground'>{metric.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Equity Curve */}
      <EquityCurveChart
        data={equityCurve}
        initialBalance={initialBalance}
        profitTargetPercent={riskSettings.profitTargetPercent}
        stopTargetPercent={riskSettings.stopTargetPercent}
        dailyLossPercent={riskSettings.dailyLossPercent}
        // Mantener fallbacks para compatibilidad
        challengeTarget={8}
        challengeStop={-10}
      />

      {/* Gráfico de Distribución P&L */}
      <PnLDistributionChart data={pnlDistribution} />
    </div>
  );
};

export default MT5Dashboard;
