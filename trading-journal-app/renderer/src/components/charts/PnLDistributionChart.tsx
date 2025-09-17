import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MT5PnLDistributionItem } from "../../types/mt5";

interface PnLDistributionChartProps {
  readonly data: MT5PnLDistributionItem[];
  readonly title?: string;
  readonly className?: string;
}

const PnLDistributionChart: React.FC<PnLDistributionChartProps> = ({
  data,
  title = "Distribución de P&L",
  className,
}) => {
  // Procesar datos para crear histograma
  const processDataForHistogram = (trades: MT5PnLDistributionItem[]) => {
    if (trades.length === 0) return [];

    // Calcular P&L neto para cada trade
    const pnlValues = trades.map((trade) => trade.netPnL);

    // Encontrar min y max
    const minPnL = Math.min(...pnlValues);
    const maxPnL = Math.max(...pnlValues);

    // Determinar número de bins (buckets)
    const numBins = Math.min(
      20,
      Math.max(5, Math.ceil(Math.sqrt(trades.length)))
    );

    // Calcular ancho de cada bin
    const binWidth = (maxPnL - minPnL) / numBins;

    // Crear bins
    const bins: Array<{
      range: string;
      count: number;
      midpoint: number;
      isProfit: boolean;
    }> = [];

    for (let i = 0; i < numBins; i++) {
      const binStart = minPnL + i * binWidth;
      const binEnd = binStart + binWidth;
      const midpoint = (binStart + binEnd) / 2;

      // Contar trades en este rango
      const count = pnlValues.filter((pnl) =>
        i === numBins - 1
          ? pnl >= binStart && pnl <= binEnd
          : pnl >= binStart && pnl < binEnd
      ).length;

      bins.push({
        range: `${binStart.toFixed(0)} - ${binEnd.toFixed(0)}`,
        count,
        midpoint,
        isProfit: midpoint >= 0,
      });
    }

    return bins.filter((bin) => bin.count > 0); // Solo mostrar bins con datos
  };

  const histogramData = processDataForHistogram(data);

  // Calcular estadísticas
  const totalTrades = data.length;
  const winTrades = data.filter((t) => t.netPnL > 0).length;
  const winRate =
    totalTrades > 0 ? ((winTrades / totalTrades) * 100).toFixed(1) : "0.0";
  const avgPnL =
    totalTrades > 0
      ? (data.reduce((sum, t) => sum + t.netPnL, 0) / totalTrades).toFixed(2)
      : "0.00";

  // Tooltip customizado
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{
      payload: {
        range: string;
        count: number;
        midpoint: number;
        isProfit: boolean;
      };
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className='bg-white p-3 border rounded-lg shadow-lg'>
          <p className='font-medium'>{`Rango: $${label}`}</p>
          <p className='text-sm text-gray-600'>{`Trades: ${data.count}`}</p>
          <p className='text-sm text-gray-600'>
            {`Punto medio: $${data.midpoint.toFixed(2)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className='text-lg font-semibold'>{title}</CardTitle>
        <CardDescription>
          {totalTrades} trades • Win Rate: {winRate}% • P&L Promedio: ${avgPnL}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {histogramData.length > 0 ? (
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <BarChart
                data={histogramData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                barCategoryGap='5%'>
                <CartesianGrid strokeDasharray='3 3' stroke='#f0f0f0' />
                <XAxis
                  dataKey='range'
                  fontSize={12}
                  tick={{ fontSize: 10 }}
                  angle={-45}
                  textAnchor='end'
                  height={80}
                />
                <YAxis
                  fontSize={12}
                  label={{
                    value: "Número de Trades",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine x={0} stroke='#666' strokeDasharray='2 2' />
                <Bar dataKey='count' radius={[2, 2, 0, 0]}>
                  {histogramData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.isProfit ? "#10b981" : "#ef4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className='h-80 flex items-center justify-center text-gray-500'>
            <div className='text-center'>
              <p className='text-lg mb-2'>No hay datos disponibles</p>
              <p className='text-sm'>
                Importa trades MT5 para ver la distribución de P&L
              </p>
            </div>
          </div>
        )}

        {/* Estadísticas adicionales */}
        {histogramData.length > 0 && (
          <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t'>
            <div className='text-center'>
              <p className='text-2xl font-bold text-green-600'>{winTrades}</p>
              <p className='text-xs text-gray-500'>Trades Ganadores</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-red-600'>
                {totalTrades - winTrades}
              </p>
              <p className='text-xs text-gray-500'>Trades Perdedores</p>
            </div>
            <div className='text-center'>
              <p className='text-2xl font-bold text-blue-600'>{winRate}%</p>
              <p className='text-xs text-gray-500'>Win Rate</p>
            </div>
            <div className='text-center'>
              <p
                className={`text-2xl font-bold ${
                  parseFloat(avgPnL) >= 0 ? "text-green-600" : "text-red-600"
                }`}>
                ${avgPnL}
              </p>
              <p className='text-xs text-gray-500'>P&L Promedio</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PnLDistributionChart;
