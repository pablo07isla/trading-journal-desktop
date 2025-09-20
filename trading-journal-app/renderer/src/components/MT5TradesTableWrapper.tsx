import React, { useState, useEffect, useCallback } from "react";

import MT5TradesTable from "./MT5TradesTable";
import MT5AutoUpdateIndicator from "./MT5AutoUpdateIndicator";
import { useMT5AutoUpdate } from "@/hooks/useMT5AutoUpdate";
import type { MT5Account } from "@/types/electron";

interface MT5TradesTableWrapperProps {
  onTradeCountChange?: (count: number) => void;
}

const MT5TradesTableWrapper: React.FC<MT5TradesTableWrapperProps> = ({
  onTradeCountChange,
}) => {
  const [accountId, setAccountId] = useState<number | undefined>(undefined);
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar cuentas MT5 disponibles
  const loadAccounts = useCallback(async () => {
    try {
      const result = await window.electronAPI.getMT5Accounts();
      if (result.success && result.data) {
        setAccounts(result.data);
        // Si hay cuentas, seleccionar la primera por defecto
        if (result.data.length > 0) {
          setAccountId(result.data[0].account_id);
        }
      }
    } catch (error) {
      console.error("Error loading MT5 accounts:", error);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Obtener count de trades MT5 cuando cambie la cuenta
  const getTradesCount = useCallback(async () => {
    if (accountId) {
      try {
        const result = await window.electronAPI.getMT5AccountTrades(accountId);
        if (result.success && result.data) {
          const count = result.data.length;
          onTradeCountChange?.(count);
        }
      } catch (error) {
        console.error("Error getting MT5 trades count:", error);
      }
    } else {
      onTradeCountChange?.(0);
    }
  }, [accountId, onTradeCountChange]);

  useEffect(() => {
    getTradesCount();
  }, [getTradesCount]);

  // Función para actualizar datos desde MT5
  const performMT5Update = useCallback(async () => {
    setUpdateMessage(null);

    try {
      console.log("Iniciando actualización de datos MT5...");
      const result = await window.electronAPI.importMT5Data();

      if (result.success) {
        const importResult = result.data;
        if (importResult && importResult.summary) {
          const { summary } = importResult;
          const message = `Actualización completada: ${summary.tradesImported} trades importados, ${summary.tradesSkipped} saltados`;
          setUpdateMessage(message);
          console.log(message);
        } else {
          setUpdateMessage("Datos actualizados correctamente");
        }

        // Recargar cuentas y conteo de trades
        await loadAccounts();
        await getTradesCount();

        // Forzar re-render del MT5TradesTable
        setRefreshKey((prev) => prev + 1);

        // Limpiar mensaje después de 5 segundos
        setTimeout(() => setUpdateMessage(null), 5000);
      } else {
        const errorMsg =
          result.error || "Error desconocido durante la actualización";
        setUpdateMessage(`Error: ${errorMsg}`);
        console.error("Error en actualización:", errorMsg);

        // Limpiar mensaje de error después de 8 segundos
        setTimeout(() => setUpdateMessage(null), 8000);
      }
    } catch (error) {
      const errorMsg = `Error al actualizar datos MT5: ${error}`;
      setUpdateMessage(errorMsg);
      console.error(errorMsg);

      // Limpiar mensaje de error después de 8 segundos
      setTimeout(() => setUpdateMessage(null), 8000);
    }
  }, [loadAccounts, getTradesCount]);

  // Hook de actualización automática
  const {
    lastUpdateTime,
    isUpdating,
    nextUpdateIn,
    manualUpdate,
    pauseAutoUpdate,
    resumeAutoUpdate,
    isAutoUpdatePaused,
  } = useMT5AutoUpdate({
    intervalMinutes: 10, // Actualizar cada 10 minutos
    enableAutoUpdate: true,
    onUpdate: performMT5Update,
    onError: (error) => {
      setUpdateMessage(`Error en actualización automática: ${error}`);
      setTimeout(() => setUpdateMessage(null), 8000);
    },
  });

  return (
    <>
      {/* Indicador de actualización automática */}
      <div className='mb-4 p-3 bg-card rounded-lg shadow-sm border'>
        <MT5AutoUpdateIndicator
          lastUpdateTime={lastUpdateTime}
          isUpdating={isUpdating}
          nextUpdateIn={nextUpdateIn}
          isAutoUpdatePaused={isAutoUpdatePaused}
          onPause={pauseAutoUpdate}
          onResume={resumeAutoUpdate}
          onManualUpdate={manualUpdate}
        />
      </div>

      {/* Mensaje de actualización */}
      {updateMessage && (
        <div
          className={`mb-4 p-3 rounded-lg text-sm ${
            updateMessage.startsWith("Error")
              ? "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30"
              : "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30"
          }`}>
          {updateMessage}
        </div>
      )}

      {/* Filtros - mantener consistencia con ManualTradesTable */}
      <div className='flex flex-wrap gap-4 items-center mb-6 p-4 bg-card rounded-lg shadow-sm border'>
        {/* Selector de cuenta MT5 */}
        <div className='flex items-center gap-2'>
          <label
            htmlFor='account-select'
            className='text-sm font-medium text-foreground'>
            Cuenta MT5:
          </label>
          <select
            id='account-select'
            value={accountId || ""}
            onChange={(e) =>
              setAccountId(e.target.value ? Number(e.target.value) : undefined)
            }
            className='px-4 py-2 border border-border rounded-lg bg-muted focus:bg-background focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all text-sm min-w-[200px]'>
            <option value=''>Seleccionar cuenta...</option>
            {accounts.map((account) => (
              <option key={account.account_id} value={account.account_id}>
                {account.account_name} ({account.account_id}) - {account.type}
              </option>
            ))}
          </select>
        </div>

        {/* Info de la cuenta seleccionada */}
        {/* {accountId && accounts.length > 0 && (
          <div className='flex items-center gap-4 text-sm text-muted-foreground'>
            <span>
              Trades: <span className='font-medium'>{mt5TradesCount}</span>
            </span>
          </div>
        )} */}
      </div>

      {/* Contenido principal */}
      {accounts.length === 0 ? (
        <div className='bg-card rounded-lg shadow-sm border overflow-hidden p-12'>
          <div className='flex flex-col items-center justify-center text-muted-foreground'>
            <div className='text-4xl mb-4'>🤖</div>
            <h3 className='text-lg font-medium mb-2 text-foreground'>
              No hay cuentas MT5 importadas
            </h3>
            <p className='text-sm text-center'>
              Importa datos desde MT5 para ver tus trades aquí.
            </p>
          </div>
        </div>
      ) : !accountId ? (
        <div className='bg-card rounded-lg shadow-sm border overflow-hidden p-12'>
          <div className='flex flex-col items-center justify-center text-muted-foreground'>
            <div className='text-4xl mb-4'>👆</div>
            <h3 className='text-lg font-medium mb-2 text-foreground'>
              Selecciona una cuenta
            </h3>
            <p className='text-sm text-center'>
              Elige una cuenta MT5 para ver sus trades importados.
            </p>
          </div>
        </div>
      ) : (
        // Usar el componente MT5TradesTable existente pero sin su propio layout
        <div className='mt5-trades-content'>
          <MT5TradesTable
            key={`${accountId}-${refreshKey}`}
            accountId={accountId}
          />
        </div>
      )}
    </>
  );
};

export default MT5TradesTableWrapper;
