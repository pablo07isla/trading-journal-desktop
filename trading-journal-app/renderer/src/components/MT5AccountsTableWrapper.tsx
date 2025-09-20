import React, { useState, useEffect, useCallback } from "react";
import MT5AccountsTable from "./MT5AccountsTable";
import MT5AutoUpdateIndicator from "./MT5AutoUpdateIndicator";
import { useMT5AutoUpdate } from "@/hooks/useMT5AutoUpdate";

interface MT5AccountsTableWrapperProps {
  onAccountCountChange?: (count: number) => void;
}

const MT5AccountsTableWrapper: React.FC<MT5AccountsTableWrapperProps> = ({
  onAccountCountChange,
}) => {
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Cargar cuentas MT5 disponibles
  const loadAccounts = useCallback(async () => {
    try {
      const result = await window.electronAPI.getMT5Accounts();
      if (result.success && result.data) {
        onAccountCountChange?.(result.data.length);
      }
    } catch (error) {
      console.error("Error loading MT5 accounts:", error);
    }
  }, [onAccountCountChange]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Función para actualizar datos desde MT5
  const performMT5Update = useCallback(async () => {
    setUpdateMessage(null);

    try {
      console.log("Iniciando actualización de cuentas MT5...");
      const result = await window.electronAPI.importMT5Data();

      if (result.success) {
        const importResult = result.data;
        if (importResult && importResult.summary) {
          const { summary } = importResult;
          const message = `Actualización completada: ${summary.accountsImported} cuentas, ${summary.tradesImported} trades importados`;
          setUpdateMessage(message);
          console.log(message);
        } else {
          setUpdateMessage("Datos actualizados correctamente");
        }

        // Recargar cuentas
        await loadAccounts();

        // Forzar re-render de la tabla
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
      const errorMsg = `Error al actualizar cuentas MT5: ${error}`;
      setUpdateMessage(errorMsg);
      console.error(errorMsg);

      // Limpiar mensaje de error después de 8 segundos
      setTimeout(() => setUpdateMessage(null), 8000);
    }
  }, [loadAccounts]);

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
      {/* Controles de actualización */}
      {/* <div className='flex flex-wrap gap-4 items-center mb-6 p-4 bg-white rounded-lg shadow-sm border'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-medium text-gray-700'>
            Cuentas MT5 Importadas
          </span>
          {accounts.length > 0 && (
            <span className='text-sm text-gray-600'>
              Total: <span className='font-medium'>{accounts.length}</span>{" "}
              cuentas
            </span>
          )}
        </div> */}

      {/* Botón de actualizar datos MT5 */}
      {/* <Button
          onClick={manualUpdate}
          disabled={isUpdating}
          className='ml-auto bg-green-600 hover:bg-green-700 text-white shadow-sm flex items-center gap-2'>
          <RefreshCw
            className={`w-4 h-4 ${isUpdating ? "animate-spin" : ""}`}
          />
          {isUpdating ? "Actualizando..." : "Actualizar MT5"}
        </Button>
      </div> */}

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
              ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
              : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
          }`}>
          {updateMessage}
        </div>
      )}

      {/* Tabla de cuentas MT5 */}
      <div key={refreshKey}>
        <MT5AccountsTable />
      </div>
    </>
  );
};

export default MT5AccountsTableWrapper;
