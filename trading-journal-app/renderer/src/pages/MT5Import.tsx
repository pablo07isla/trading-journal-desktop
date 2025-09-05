// Página para importar y mostrar datos de MT5
// ...implementación pendiente...

import { useState } from "react";

import MT5AccountsTable from "../components/MT5AccountsTable";
import MT5TradesTable from "../components/MT5TradesTable";
import DiagnosticPanel from "../components/DiagnosticPanel";
interface MT5ImportResult {
  success: boolean;
  data?: {
    account: Record<string, unknown>;
    trades: unknown[];
  };
  error?: string;
}

const MT5Import = () => {
  const [importResult, setImportResult] = useState<MT5ImportResult | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshAccounts, setRefreshAccounts] = useState(0);
  const [clearLoading, setClearLoading] = useState(false);

  const handleImportMT5 = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.importMT5Data();
      setImportResult({
        success: result.success,
        data: result.data
          ? {
              account: result.data.account as unknown as Record<
                string,
                unknown
              >,
              trades: result.data.trades as unknown[],
            }
          : undefined,
        error: result.error,
      });
      // Forzar refresco de la tabla de cuentas MT5
      setRefreshAccounts((r) => r + 1);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al importar datos");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearAllTrades = async () => {
    if (
      !confirm(
        "¿Estás seguro de que deseas borrar todos los trades MT5? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    setClearLoading(true);
    setError(null);
    try {
      const result = await window.electronAPI.clearAllMT5Trades();
      if (result.success) {
        alert(`Se eliminaron ${result.data?.changes || 0} trades MT5`);
        // Forzar refresco de las tablas
        setRefreshAccounts((r) => r + 1);
      } else {
        setError(result.error || "Error al limpiar trades");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error al limpiar trades");
      }
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <div className='p-4'>
      <h1 className='text-xl font-bold mb-4'>Importar datos de MT5</h1>
      <div className='mb-4 space-x-2'>
        <button
          className='bg-blue-600 text-white px-4 py-2 rounded'
          onClick={handleImportMT5}
          disabled={loading || clearLoading}>
          {loading ? "Importando..." : "Importar datos de MT5"}
        </button>
        <button
          className='bg-red-600 text-white px-4 py-2 rounded'
          onClick={handleClearAllTrades}
          disabled={loading || clearLoading}>
          {clearLoading ? "Limpiando..." : "Limpiar todos los trades"}
        </button>
      </div>
      {error && <div className='text-red-600 mb-2'>{error}</div>}
      {importResult && importResult.success && (
        <div className='mt-4'>
          <h2 className='font-semibold'>Cuenta importada:</h2>
          <pre className='bg-gray-100 p-2 rounded text-xs overflow-x-auto'>
            {JSON.stringify(importResult.data?.account, null, 2)}
          </pre>
          <h2 className='font-semibold mt-4'>Trades importados:</h2>
          <pre className='bg-gray-100 p-2 rounded text-xs overflow-x-auto'>
            {JSON.stringify(importResult.data?.trades, null, 2)}
          </pre>
        </div>
      )}
      {importResult && !importResult.success && (
        <div className='text-red-600 mt-2'>{importResult.error}</div>
      )}
      <div className='mt-8'>
        <MT5AccountsTable key={refreshAccounts} />
      </div>
      <div className='mt-8'>
        <MT5TradesTable />
      </div>
      <div className='mt-8'>
        <DiagnosticPanel />
      </div>
    </div>
  );
};

export default MT5Import;
