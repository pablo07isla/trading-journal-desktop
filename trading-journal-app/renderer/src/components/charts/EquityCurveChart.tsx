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
  readonly challengeMode?: boolean;
  readonly challengeTarget?: number; // Porcentaje para pasar el challenge (default: 8%)
  readonly challengeStop?: number; // Porcentaje para perder el challenge (default: -10%)
}

const EquityCurveChart: React.FC<EquityCurveChartProps> = ({
  data,
  title = "Curva de Equity",
  className,
  initialBalance = 0,
  challengeMode = true,
  challengeTarget = 8, // 8% para pasar
  challengeStop = -10, // -10% para perder
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
  const currentEquity =
    equityCurveData.length > 0
      ? equityCurveData[equityCurveData.length - 1].equity
      : initialBalance;
  const totalReturn = currentEquity - initialBalance;
  const totalReturnPercent =
    initialBalance > 0
      ? ((totalReturn / initialBalance) * 100).toFixed(2)
      : "0.00";

  // Niveles del challenge
  const challengeTargetLevel = initialBalance * (1 + challengeTarget / 100);
  const challengeStopLevel = initialBalance * (1 + challengeStop / 100);

  // Debug: Log para verificar valores
  console.log("EquityCurveChart Debug:", {
    challengeMode,
    challengeTarget,
    challengeStop,
    initialBalance,
    challengeTargetLevel,
    challengeStopLevel,
    currentEquity,
    dataLength: equityCurveData.length,
  });

  // Estado del challenge
  const challengeStatus = challengeMode
    ? currentEquity >= challengeTargetLevel
      ? "passed"
      : currentEquity <= challengeStopLevel
      ? "failed"
      : "in-progress"
    : null;

  // Distancia a los objetivos del challenge
  const distanceToTarget = challengeMode
    ? (((challengeTargetLevel - currentEquity) / initialBalance) * 100).toFixed(
        2
      )
    : "0.00";
  const distanceToStop = challengeMode
    ? (((currentEquity - challengeStopLevel) / initialBalance) * 100).toFixed(2)
    : "0.00";

  // Calcular drawdown máximo
  let maxEquity = initialBalance;
  let maxDrawdown = 0;
  equityCurveData.forEach((point) => {
    if (point.equity > maxEquity) {
      maxEquity = point.equity;
    }
    const drawdown =
      maxEquity > 0 ? ((maxEquity - point.equity) / maxEquity) * 100 : 0;
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

  // Calcular el rango para el YAxis optimizado para mostrar las líneas de referencia
  const getYAxisDomain = () => {
    if (equityCurveData.length === 0) {
      return challengeMode
        ? [challengeStopLevel * 0.9, challengeTargetLevel * 1.1]
        : [initialBalance * 0.9, initialBalance * 1.1];
    }

    const dataValues = equityCurveData.map((d) => d.equity);
    let dataMin = Math.min(...dataValues);
    let dataMax = Math.max(...dataValues);

    // Incluir balance inicial siempre
    const referenceValues = [initialBalance];

    // Incluir líneas de challenge si está activo
    if (challengeMode) {
      referenceValues.push(challengeTargetLevel, challengeStopLevel);
    }

    // Expandir dominio para incluir todas las referencias
    const allValues = [...dataValues, ...referenceValues];
    dataMin = Math.min(...allValues);
    dataMax = Math.max(...allValues);

    // Margen más pequeño para mejor ajuste
    const range = dataMax - dataMin;
    const margin = Math.max(range * 0.05, 50); // Mínimo 50 de margen

    const finalDomain = [dataMin - margin, dataMax + margin];

    console.log("YAxis Domain Debug:", {
      dataValues: {
        min: Math.min(...dataValues),
        max: Math.max(...dataValues),
      },
      referenceValues,
      finalDomain,
      challengeMode,
      challengeTargetLevel,
      challengeStopLevel,
    });

    return finalDomain;
  };

  const gradientOffset = getGradientOffset();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        <CardDescription>
          {equityCurveData.length} trades • Return: {totalReturnPercent}% • Max
          DD: {maxDrawdown.toFixed(2)}%
          {challengeMode && (
            <>
              {" • "}
              <span
                className={
                  challengeStatus === "passed"
                    ? "text-green-600 dark:text-green-400"
                    : challengeStatus === "failed"
                    ? "text-red-600 dark:text-red-400"
                    : "text-blue-600 dark:text-blue-400"
                }>
                Challenge:{" "}
                {challengeStatus === "passed"
                  ? "PASADO"
                  : challengeStatus === "failed"
                  ? "FALLIDO"
                  : "EN PROGRESO"}
              </span>
            </>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {equityCurveData.length > 0 ? (
          <ChartContainer config={chartConfig} className='min-h-[240px] w-full'>
            <AreaChart
              accessibilityLayer
              data={equityCurveData}
              margin={{ top: 15, right: 25, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id='equityGradient' x1='0' y1='0' x2='0' y2='1'>
                  <stop
                    offset={gradientOffset}
                    stopColor='hsl(var(--chart-1))'
                    stopOpacity={0.8}
                  />
                  <stop
                    offset={gradientOffset}
                    stopColor='hsl(var(--chart-5))'
                    stopOpacity={0.8}
                  />
                </linearGradient>
                <linearGradient
                  id='equityGradientFill'
                  x1='0'
                  y1='0'
                  x2='0'
                  y2='1'>
                  <stop
                    offset={gradientOffset}
                    stopColor='hsl(var(--chart-1))'
                    stopOpacity={0.2}
                  />
                  <stop
                    offset={gradientOffset}
                    stopColor='hsl(var(--chart-5))'
                    stopOpacity={0.2}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' vertical={false} />
              <XAxis
                dataKey='date'
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
                domain={getYAxisDomain()}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      `$${Number(value).toFixed(2)}`,
                      name === "equity" ? "Equity" : String(name),
                    ]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        return `Fecha: ${
                          payload[0]?.payload?.fullDate || label
                        }`;
                      }
                      return `Fecha: ${label}`;
                    }}
                  />
                }
              />
              {/* TODAS LAS LÍNEAS DE REFERENCIA ANTES DEL AREA */}

              {/* Target Line - Verde - Siempre renderizada, condicionalmente visible */}
              <ReferenceLine
                y={challengeMode ? challengeTargetLevel : null}
                stroke={challengeMode ? "#10b981" : "transparent"}
                strokeDasharray={challengeMode ? "3 3" : "0"}
                strokeWidth={challengeMode ? 2 : 0}
                label={
                  challengeMode
                    ? {
                        value: `Target: ${challengeTargetLevel.toFixed(
                          0
                        )} (+${challengeTarget}%)`,
                        position: "insideTopLeft",
                        fontSize: 12,
                        fill: "#10b981",
                      }
                    : undefined
                }
              />

              {/* Stop Line - Roja - Siempre renderizada, condicionalmente visible */}
              <ReferenceLine
                y={challengeMode ? challengeStopLevel : null}
                stroke={challengeMode ? "#ef4444" : "transparent"}
                strokeDasharray={challengeMode ? "3 3" : "0"}
                strokeWidth={challengeMode ? 2 : 0}
                label={
                  challengeMode
                    ? {
                        value: `Stop: ${challengeStopLevel.toFixed(
                          0
                        )} (${challengeStop}%)`,
                        position: "insideBottomLeft",
                        fontSize: 12,
                        fill: "#ef4444",
                      }
                    : undefined
                }
              />

              {/* Línea de Balance Inicial */}
              <ReferenceLine
                y={initialBalance}
                stroke='hsl(var(--border))'
                strokeDasharray='3 3'
                strokeWidth={2}
                label={{
                  value: `Balance: ${initialBalance.toFixed(0)}`,
                  position: "insideTopRight",
                  fontSize: 12,
                }}
              />

              {/* AREA AL FINAL CON MENOS OPACIDAD */}
              <Area
                type='monotone'
                dataKey='equity'
                stroke='url(#equityGradient)'
                strokeWidth={1}
                fill='url(#equityGradientFill)'
                fillOpacity={0.2}
              />
            </AreaChart>
          </ChartContainer>
        ) : (
          <div className='min-h-[240px] flex items-center justify-center text-muted-foreground'>
            <div className='text-center'>
              <p className='text-lg mb-2'>No hay datos de equity disponibles</p>
              <p className='text-sm'>
                Importa trades MT5 para ver la curva de equity
              </p>
            </div>
          </div>
        )}

        {/* Estadísticas adicionales */}
        {equityCurveData.length > 0 && (
          <div className='mt-4 pt-4 border-t'>
            {challengeMode ? (
              // Vista Challenge Mode
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-foreground'>
                    ${currentEquity.toFixed(2)}
                  </p>
                  <p className='text-xs text-muted-foreground'>Equity Actual</p>
                </div>
                <div className='text-center'>
                  <p
                    className={`text-2xl font-bold ${
                      parseFloat(totalReturnPercent) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                    {totalReturnPercent}%
                  </p>
                  <p className='text-xs text-muted-foreground'>Return %</p>
                </div>
                <div className='text-center'>
                  <p
                    className={`text-2xl font-bold ${
                      parseFloat(distanceToTarget) > 0
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-green-600 dark:text-green-400"
                    }`}>
                    {parseFloat(distanceToTarget) > 0
                      ? distanceToTarget
                      : "0.00"}
                    %
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {parseFloat(distanceToTarget) > 0
                      ? "Para Target"
                      : "Target Alcanzado"}
                  </p>
                </div>
                <div className='text-center'>
                  <p
                    className={`text-2xl font-bold ${
                      parseFloat(distanceToStop) > 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                    {parseFloat(distanceToStop) > 0 ? distanceToStop : "0.00"}%
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    {parseFloat(distanceToStop) > 0
                      ? "Margen Stop"
                      : "Stop Loss"}
                  </p>
                </div>
              </div>
            ) : (
              // Vista Normal
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-foreground'>
                    ${currentEquity.toFixed(2)}
                  </p>
                  <p className='text-xs text-muted-foreground'>Equity Actual</p>
                </div>
                <div className='text-center'>
                  <p
                    className={`text-2xl font-bold ${
                      totalReturn >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                    ${totalReturn.toFixed(2)}
                  </p>
                  <p className='text-xs text-muted-foreground'>Return Total</p>
                </div>
                <div className='text-center'>
                  <p
                    className={`text-2xl font-bold ${
                      parseFloat(totalReturnPercent) >= 0
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                    {totalReturnPercent}%
                  </p>
                  <p className='text-xs text-muted-foreground'>Return %</p>
                </div>
                <div className='text-center'>
                  <p className='text-2xl font-bold text-red-600 dark:text-red-400'>
                    {maxDrawdown.toFixed(2)}%
                  </p>
                  <p className='text-xs text-muted-foreground'>Max Drawdown</p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EquityCurveChart;
