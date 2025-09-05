import React from "react";
import { Button } from "@/components/ui/button";

const DiagnosticPanel: React.FC = () => {
  const handleDiagnose = async () => {
    try {
      console.log("Iniciando diagnóstico...");
      const result = await window.electronAPI.diagnoseMT5CreatedAt();
      console.log("Resultado diagnóstico:", result);
      alert(
        "Diagnóstico completado. Revisa la consola del navegador y la consola de Electron."
      );
    } catch (error) {
      console.error("Error en diagnóstico:", error);
      alert("Error en diagnóstico: " + error);
    }
  };

  const handleForceUpdate = async () => {
    try {
      console.log("Iniciando actualización forzada...");
      const result = await window.electronAPI.forceUpdateMT5CreatedAt();
      console.log("Resultado actualización:", result);
      alert("Actualización completada. Resultado: " + JSON.stringify(result));
    } catch (error) {
      console.error("Error en actualización:", error);
      alert("Error en actualización: " + error);
    }
  };

  const handleGetAccounts = async () => {
    try {
      console.log("Obteniendo cuentas MT5...");
      const result = await window.electronAPI.getMT5Accounts();
      console.log("Cuentas MT5:", result);
      alert("Cuentas obtenidas. Revisa la consola para ver los detalles.");
    } catch (error) {
      console.error("Error obteniendo cuentas:", error);
      alert("Error obteniendo cuentas: " + error);
    }
  };

  return (
    <div className='p-4 border border-gray-300 rounded-lg space-y-4'>
      <h3 className='text-lg font-semibold'>Panel de Diagnóstico MT5</h3>
      <div className='space-y-2'>
        <Button onClick={handleDiagnose} variant='outline'>
          Ejecutar Diagnóstico
        </Button>
        <Button onClick={handleForceUpdate} variant='destructive'>
          Forzar Actualización Created_At
        </Button>
        <Button onClick={handleGetAccounts} variant='secondary'>
          Ver Cuentas MT5
        </Button>
      </div>
      <p className='text-sm text-gray-600'>
        Revisa la consola de DevTools (F12) y la consola de Electron para ver
        los logs detallados.
      </p>
    </div>
  );
};

export default DiagnosticPanel;
