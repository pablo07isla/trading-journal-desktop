import React, { useState, useEffect } from "react";
import AccountViewSelector from "@/components/AccountViewSelector";
import ManualAccountsTable from "@/components/ManualAccountsTable";
import MT5AccountsTableWrapper from "@/components/MT5AccountsTableWrapper";

type AccountViewMode = "manual" | "mt5";

export const TradingAccounts: React.FC = () => {
  const [currentView, setCurrentView] = useState<AccountViewMode>(() => {
    const savedView = localStorage.getItem("trading-accounts-view");
    return (savedView as AccountViewMode) || "manual";
  });
  const [manualAccountCount, setManualAccountCount] = useState(0);
  const [mt5AccountCount, setMT5AccountCount] = useState(0);

  useEffect(() => {
    localStorage.setItem("trading-accounts-view", currentView);
  }, [currentView]);

  return (
    <div className='w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 bg-gray-50 min-h-screen overflow-x-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Cuentas de Trading
        </h1>
        <p className='text-gray-600'>
          Gestiona tus cuentas de trading en diferentes brokers
        </p>
      </div>

      {/* Selector de vista */}
      <div className='mb-6 flex justify-center'>
        <AccountViewSelector
          mode={currentView}
          onModeChange={setCurrentView}
          manualCount={manualAccountCount}
          mt5Count={mt5AccountCount}
        />
      </div>

      {/* Contenido basado en la vista seleccionada */}
      {currentView === "manual" ? (
        <ManualAccountsTable onAccountCountChange={setManualAccountCount} />
      ) : (
        <MT5AccountsTableWrapper onAccountCountChange={setMT5AccountCount} />
      )}
    </div>
  );
};
