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
import type { TradeData } from "@/types/electron";
import type { TradingAccountData } from "@/types/electron";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";

const Dashboard: React.FC = () => {
  const [trades, setTrades] = useState<TradeData[]>([]);
  const [period, setPeriod] = useState("7days");
  const [strategy, setStrategy] = useState("all");
  const [account, setAccount] = useState("all");
  const [accounts, setAccounts] = useState<Record<number, string>>({});
  const [strategies, setStrategies] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchTrades = async () => {
      let tradesData = await window.electronAPI.getTrades();
      // Filtro por estrategia
      if (strategy !== "all") {
        tradesData = tradesData.filter((t) => {
          if (!("strategy" in t) || !t.strategy) return false;
          if (strategy === "breakout") return t.strategy === "Breakout";
          if (strategy === "reversion") return t.strategy === "Reversión";
          if (strategy === "pullback") return t.strategy === "Pullback";
          return false;
        });
      }
      // Filtro por cuenta
      if (account !== "all") {
        tradesData = tradesData.filter((t) => {
          // t.cuentaTradingId puede ser number o undefined
          return String(t.cuentaTradingId) === account;
        });
      }
      // Filtro por periodo
      const now = new Date();
      let fromDate: Date;
      if (period === "7days")
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      else if (period === "month")
        fromDate = new Date(now.getFullYear(), now.getMonth(), 1);
      else if (period === "year") fromDate = new Date(now.getFullYear(), 0, 1);
      else fromDate = new Date(0);
      tradesData = tradesData.filter((t) => {
        const d = new Date(t.entryDate);
        return d >= fromDate && d <= now;
      });
      setTrades(tradesData);
    };
    fetchTrades();
  }, [period, strategy, account]);

  useEffect(() => {
    const fetchAccounts = async () => {
      const accs = await window.electronAPI.getTradingAccounts?.();
      if (Array.isArray(accs)) {
        const map: Record<number, string> = {};
        accs.forEach((a) => {
          if (a.id !== undefined) map[a.id] = a.nombre;
        });
        setAccounts(map);
      }
    };
    fetchAccounts();
  }, []);

  useEffect(() => {
    const fetchStrategies = async () => {
      const strats = await window.electronAPI.getStrategies?.();
      if (Array.isArray(strats)) {
        const map: Record<number, string> = {};
        strats.forEach((s) => {
          if (s.id !== undefined) map[s.id] = s.nombre;
        });
        setStrategies(map);
      }
    };
    fetchStrategies();
  }, []);

  // KPIs
  const totalPL = trades.reduce(
    (acc, t) => acc + (typeof t.pnl === "number" ? t.pnl : 0),
    0
  );
  const numTrades = trades.length;
  const winTrades = trades.filter(
    (t) => typeof t.pnl === "number" && t.pnl > 0
  ).length;
  const winRate = numTrades > 0 ? (winTrades / numTrades) * 100 : 0;
  const avgTrade = numTrades > 0 ? totalPL / numTrades : 0;

  // Obtener el balance inicial de la(s) cuenta(s) desde TradingAccountData
  // accountsData: Record<number, string> sólo tiene nombre, pero necesitamos balanceInicial
  // Por lo tanto, obtendremos los datos completos de las cuentas
  const [accountsData, setAccountsData] = useState<TradingAccountData[]>([]);

  useEffect(() => {
    const fetchAccountsFull = async () => {
      const accs = await window.electronAPI.getTradingAccounts?.();
      if (Array.isArray(accs)) {
        setAccountsData(accs);
      }
    };
    fetchAccountsFull();
  }, []);

  let initialBalance = 0;
  if (account !== "all") {
    // Buscar el balance inicial de la cuenta seleccionada
    const acc = accountsData.find((a) => String(a.id) === account);
    initialBalance = acc?.balanceInicial ?? 0;
  } else {
    // Sumar el balance inicial de todas las cuentas presentes en accountsData
    initialBalance = accountsData.reduce(
      (acc, a) => acc + (a.balanceInicial ?? 0),
      0
    );
  }

  // Calcular el cambio porcentual sobre el balance inicial
  const changePercent =
    initialBalance > 0 ? ((totalPL / initialBalance) * 100).toFixed(1) : "0.0";

  // Equity curve (acumulado)
  const sortedTrades = [...trades].sort(
    (a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
  );
  let equity = 0;
  const equityCurve = sortedTrades.map((t) => {
    equity += typeof t.pnl === "number" ? t.pnl : 0;

    // Usar la fecha tal como está en el tradelog, asegurando formato consistente
    // Crear fecha con hora fija para evitar problemas de zona horaria
    const parts = t.entryDate.split("T")[0].split("-");
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // Meses en JS son 0-11
    const day = parseInt(parts[2]);

    // Crear fecha con hora fija a mediodía para evitar problemas de zona horaria
    const d = new Date(year, month, day, 12, 0, 0);

    const localDate = `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;
    return { date: localDate, value: equity };
  });

  // Si no hay trades, mostrar curva plana
  if (equityCurve.length === 0) {
    equityCurve.push({ date: new Date().toISOString(), value: 0 });
  }

  // Preprocesar datos para el gráfico
  const equityCurveWithAreas = equityCurve.map((p) => ({
    ...p,
    equity: p.value,
  }));

  // Calcular el offset del gradiente basado en los valores min/max
  const gradientOffset = () => {
    if (equityCurveWithAreas.length === 0) return 0.5;

    const dataMax = Math.max(...equityCurveWithAreas.map((i) => i.equity));
    const dataMin = Math.min(...equityCurveWithAreas.map((i) => i.equity));

    if (dataMax <= 0) {
      return 0;
    }
    if (dataMin >= 0) {
      return 1;
    }

    return dataMax / (dataMax - dataMin);
  };

  const off = gradientOffset();

  // Grilla de KPIs
  const kpiData = [
    {
      title: "P&L Total",
      value: `$${totalPL.toFixed(2)}`,
      trend: totalPL >= 0 ? "up" : "down",
      change: `${changePercent}%`,
      subtitle: "Ganancia/Pérdida acumulada",
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
      value: numTrades,
      trend: "up",
      change: "",
      subtitle: "Cantidad de trades",
      description: "Total en el período",
      icon: Users,
    },
    {
      title: "Win Rate",
      value: `${winRate.toFixed(1)}%`,
      trend: winRate >= 50 ? "up" : "down",
      change: "",
      subtitle: "Porcentaje de trades ganadores",
      description: "Win rate sobre el total",
      icon: Activity,
    },
    {
      title: "Trade Promedio",
      value: `${avgTrade >= 0 ? "+" : "-"}$${Math.abs(avgTrade).toFixed(2)}`,
      trend: avgTrade >= 0 ? "up" : "down",
      change: "",
      subtitle: "Ganancia/Pérdida promedio",
      description: "Promedio por trade",
      icon: Target,
    },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 space-y-6 bg-gray-50 min-h-screen overflow-x-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex flex-wrap gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[160px] bg-white">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 días</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Select value={strategy} onValueChange={setStrategy}>
            <SelectTrigger className="w-[180px] bg-white">
              <SelectValue placeholder="Estrategia" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las estrategias</SelectItem>
              <SelectItem value="breakout">Breakout</SelectItem>
              <SelectItem value="reversion">Reversión</SelectItem>
              <SelectItem value="pullback">Pullback</SelectItem>
            </SelectContent>
          </Select>
          {/* Filtro por cuenta de trading */}
          <Select value={account} onValueChange={setAccount}>
            <SelectTrigger className="w-[200px] bg-white">
              <SelectValue placeholder="Cuenta de trading" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las cuentas</SelectItem>
              {Object.entries(accounts).map(([id, nombre]) => (
                <SelectItem key={id} value={id}>
                  {nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          const isPositive = kpi.trend === "up";
          return (
            <Card
              key={index}
              className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon className="h-4 w-4" />
                    {kpi.title}
                  </div>
                  <div
                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      isPositive
                        ? "bg-green-50 text-green-700"
                        : "bg-red-50 text-red-700"
                    }`}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {kpi.change}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold text-gray-900">
                    {kpi.value}
                  </div>
                  <div className="text-sm text-gray-600">{kpi.subtitle}</div>
                  <div className="text-xs text-gray-500">{kpi.description}</div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Chart Section */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Equity Curve
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Curva de equity acumulada
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={equityCurveWithAreas}
                margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset={off} stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset={off} stopColor="#ef4444" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => {
                    // date está en formato dd/mm/yyyy
                    const [day, month] = date.split("/");
                    return `${day}/${month}`;
                  }}
                  minTickGap={20}
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  width={60}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value: number) => [
                    `${value.toFixed(2)}`,
                    "Equity",
                  ]}
                  labelFormatter={(label) => {
                    // label es dd/mm/yyyy
                    return `Fecha: ${label}`;
                  }}
                  contentStyle={{ fontSize: 13 }}
                />

                {/* Línea de referencia en 0 */}
                <ReferenceLine y={0} stroke="#6b7280" strokeDasharray="2 2" />

                {/* Área principal con gradiente que cambia de color según el valor */}
                <Area
                  type="monotone"
                  dataKey="equity"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  fill="url(#splitColor)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Métricas por Estrategia / Cuenta de trading */}
      <Card className="bg-white border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Métricas por Estrategia / Cuenta de trading
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <MetricsByGroup
            trades={trades}
            accounts={accounts}
            strategies={strategies}
          />
        </CardContent>
      </Card>

      <div className="text-center text-gray-500 text-sm bg-white rounded-lg p-4 border border-gray-200">
        Dashboard completamente funcional con datos en tiempo real
      </div>
    </div>
  );
};

// ---
// Componente para métricas por grupo (estrategia/cuenta)

interface MetricsByGroupProps {
  readonly trades: TradeData[];
  readonly accounts: Record<number, string>;
  readonly strategies: Record<number, string>;
}

const MetricsByGroup: React.FC<MetricsByGroupProps> = ({
  trades,
  accounts,
  strategies,
}) => {
  const [groupBy, setGroupBy] = useState<"strategy" | "account">("strategy");

  // Agrupar trades por estrategia o cuenta
  const grouped = useMemo(() => {
    const map = new Map<string, TradeData[]>();
    trades.forEach((t) => {
      let key: string;
      if (groupBy === "strategy") {
        key =
          t.strategyId !== undefined && strategies[t.strategyId]
            ? strategies[t.strategyId]
            : "Sin estrategia";
      } else {
        key =
          t.cuentaTradingId !== undefined && accounts[t.cuentaTradingId]
            ? accounts[t.cuentaTradingId]
            : "Sin cuenta";
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)?.push(t);
    });
    return Array.from(map.entries());
  }, [trades, groupBy, accounts, strategies]);

  // Calcular métricas para cada grupo
  const rows = grouped.map(([name, group]) => {
    const num = group.length;
    const wins = group.filter(
      (t) => typeof t.pnl === "number" && t.pnl > 0
    ).length;
    const winRate = num > 0 ? (wins / num) * 100 : 0;
    const totalPL = group.reduce(
      (acc, t) => acc + (typeof t.pnl === "number" ? t.pnl : 0),
      0
    );
    return {
      name,
      num,
      winRate,
      totalPL,
    };
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-gray-900">Agrupar por:</span>
        <Select
          value={groupBy}
          onValueChange={(v) => setGroupBy(v as "strategy" | "account")}
        >
          <SelectTrigger className="w-[200px] bg-white border-gray-200 shadow-sm">
            <SelectValue placeholder="Agrupar por" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="strategy">Estrategia</SelectItem>
            <SelectItem value="account">Cuenta de trading</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50 border-b border-gray-200">
              <TableHead className="font-semibold text-gray-900 px-6 py-4">
                {groupBy === "strategy" ? "Estrategia" : "Cuenta"}
              </TableHead>
              <TableHead className="font-semibold text-gray-900 px-6 py-4 text-center">
                # Trades
              </TableHead>
              <TableHead className="font-semibold text-gray-900 px-6 py-4 text-center">
                Win Rate
              </TableHead>
              <TableHead className="font-semibold text-gray-900 px-6 py-4 text-right">
                P&L Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-gray-500 py-8 px-6"
                >
                  No hay datos para mostrar
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, index) => (
                <TableRow
                  key={row.name}
                  className={`border-b border-gray-100 hover:bg-gray-50/50 transition-colors ${
                    index === rows.length - 1 ? "border-b-0" : ""
                  }`}
                >
                  <TableCell className="px-6 py-4 font-medium text-gray-900">
                    {row.name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center text-gray-700">
                    {row.num}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        row.winRate >= 60
                          ? "bg-green-100 text-green-800"
                          : row.winRate >= 40
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {row.winRate.toFixed(1)}%
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <span
                      className={`font-semibold ${
                        row.totalPL >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {row.totalPL >= 0 ? "+" : "-"}$
                      {Math.abs(row.totalPL).toFixed(2)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Dashboard;
