import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MT5EquityCurveItem } from "../../types/mt5";

interface EquityCurveChartProps {
  readonly data: MT5EquityCurveItem[];
  readonly title?: string;
  readonly className?: string;
  readonly initialBalance?: number;
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data,
  title = "Curva de Equity",
  className,
  initialBalance = 0,
}) => {
  // Chart configuration
  const chartConfig = {
    equity: {
      label: "Equity",
      color: "hsl(var(--chart-1))",
    },
    profit: {
      label: "Ganancia",
      color: "hsl(var(--chart-1))",
    },
    loss: {
      label: "Pérdida",
      color: "hsl(var(--chart-5))",
    },
  } satisfies ChartConfig;

  // Procesar datos para la curva de equity
  const processEquityCurveData = (equityData: MT5EquityCurveItem[]) => {
    if (!equityData.length) return [];

    let runningEquity = initialBalance;
    return equityData.map((item, index) => {
      runningEquity += item.netPnL;
      return {
        date: new Date(item.open_time).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }),
        fullDate: new Date(item.open_time).toLocaleDateString(),
        equity: runningEquity,
        change: item.netPnL,
        index,
        isProfit: runningEquity >= initialBalance,
      };
    });
  };

  const equityCurveData = processEquityCurveData(data);

  // Calcular estadísticas
  const currentEquity = equityCurveData.length > 0 ? equityCurveData[equityCurveData.length - 1].equity : initialBalance;
  const totalReturn = currentEquity - initialBalance;
  const totalReturnPercent = initialBalance > 0 ? ((totalReturn / initialBalance) * 100).toFixed(2) : "0.00";
  
  // Calcular drawdown máximo
  let maxEquity = initialBalance;
  let maxDrawdown = 0;
  equityCurveData.forEach(point => {
    if (point.equity > maxEquity) {
      maxEquity = point.equity;
    }
    const drawdown = maxEquity > 0 ? ((maxEquity - point.equity) / maxEquity) * 100 : 0;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
    }
  });

  // Función para determinar el gradiente
  const getGradientOffset = () => {
    if (!equityCurveData.length) return 0;
    const dataMax = Math.max(...equityCurveData.map((i) => i.equity));
    const dataMin = Math.min(...equityCurveData.map((i) => i.equity));

    if (dataMax <= initialBalance) return 0;
    if (dataMin >= initialBalance) return 1;

    return (dataMax - initialBalance) / (dataMax - dataMin);
  };

  const gradientOffset = getGradientOffset();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>
          {equityCurveData.length} trades • Return: {totalReturnPercent}% • Max DD: {maxDrawdown.toFixed(2)}%
        </CardDescription>
      </CardHeader>
      <CardContent>
        {equityCurveData.length > 0 ? (
          <ChartContainer config={chartConfig} className="min-h-[320px] w-full">
            <AreaChart
              accessibilityLayer
              data={equityCurveData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset={gradientOffset} 
                    stopColor="hsl(var(--chart-1))" 
                    stopOpacity={0.8} 
                  />
                  <stop 
                    offset={gradientOffset} 
                    stopColor="hsl(var(--chart-5))" 
                    stopOpacity={0.8} 
                  />
                </linearGradient>
                <linearGradient id="equityGradientFill" x1="0" y1="0" x2="0" y2="1">
                  <stop 
                    offset={gradientOffset} 
                    stopColor="hsl(var(--chart-1))" 
                    stopOpacity={0.2} 
                  />
                  <stop 
                    offset={gradientOffset} 
                    stopColor="hsl(var(--chart-5))" 
                    stopOpacity={0.2} 
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="date"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}`,
                      name === "equity" ? "Equity" : String(name)
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return `Fecha: ${payload[0]?.payload?.fullDate || label}`;
                      }
                      return `Fecha: ${label}`;
                    }}
                  />
                }
              />
              <ReferenceLine 
                y={initialBalance} 
                stroke="hsl(var(--border))" 
                strokeDasharray="3 3"
                label={{ value: "Balance Inicial", position: "insideTopRight" }}
              />
              <Area
                type="monotone"
                dataKey="equity"
                stroke="url(#equityGradient)"
                strokeWidth={2}
                fill="url(#equityGradientFill)"
                fillOpacity={0.6}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className="min-h-[320px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">No hay datos de equity disponibles</p>
              <p className="text-sm">
                Importa trades MT5 para ver la curva de equity
              </p>
            </div>
          </div>
        )}

        {/* Estadísticas adicionales */}
        {equityCurveData.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">
                ${currentEquity.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Equity Actual</p>
            </div>
            <div className="text-center">
              <p 
                className={`text-2xl font-bold ${
                  totalReturn >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                ${totalReturn.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">Return Total</p>
            </div>
            <div className="text-center">
              <p 
                className={`text-2xl font-bold ${
                  parseFloat(totalReturnPercent) >= 0 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                }`}>
                {totalReturnPercent}%
              </p>
              <p className="text-xs text-muted-foreground">Return %</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {maxDrawdown.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">Max Drawdown</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquityCurveChart;