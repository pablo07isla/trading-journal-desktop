import React, { useState, useEffect } from "react";
import TradeViewSelector, {
  type TradeViewMode,
} from "@/components/TradeViewSelector";
import ManualTradesTable from "@/components/ManualTradesTable";
import MT5TradesTableWrapper from "@/components/MT5TradesTableWrapper";

const TradeLog: React.FC = () => {
  const [viewMode, setViewMode] = useState<TradeViewMode>(() => {
    // Cargar vista guardada desde localStorage
    const savedMode = localStorage.getItem("tradeLogViewMode") as TradeViewMode;
    return savedMode || "manual";
  });
  const [manualTradesCount, setManualTradesCount] = useState(0);
  const [mt5TradesCount, setMt5TradesCount] = useState(0);

  // Guardar vista en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("tradeLogViewMode", viewMode);
  }, [viewMode]);

  const handleViewModeChange = (mode: TradeViewMode) => {
    setViewMode(mode);
  };

  return (
    <div className='w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 bg-gray-50 min-h-screen overflow-x-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Diario de Operaciones
        </h1>
        <p className='text-gray-600'>
          Registro completo de tus trades y operaciones
        </p>
      </div>

      {/* Selector de Vista */}
      <div className='mb-6 flex justify-center'>
        <TradeViewSelector
          mode={viewMode}
          onModeChange={handleViewModeChange}
          manualCount={manualTradesCount}
          mt5Count={mt5TradesCount}
        />
      </div>

      {/* Contenido Condicional */}
      {viewMode === "manual" ? (
        <ManualTradesTable onTradeCountChange={setManualTradesCount} />
      ) : (
        <MT5TradesTableWrapper onTradeCountChange={setMt5TradesCount} />
      )}
    </div>
  );
};

export default TradeLog;
