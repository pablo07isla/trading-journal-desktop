import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Edit } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { formatAccountDate } from "@/lib/dateUtils";
import { toast } from "sonner";
import MT5AccountEditModal from "./MT5AccountEditModal";
import type { MT5Account } from "../types/electron";

const MT5AccountsTable: React.FC = () => {
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAccount, setEditingAccount] = useState<MT5Account | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    console.log("MT5AccountsTable: Iniciando carga de cuentas...");
    try {
      const res = await window.electronAPI.getMT5Accounts();
      console.log("MT5AccountsTable: Respuesta recibida:", res);
      if (res.success && res.data) {
        console.log(
          "MT5AccountsTable: Cuentas cargadas:",
          res.data.length,
          res.data
        );
        setAccounts(res.data);
      } else {
        console.error("MT5AccountsTable: Error en respuesta:", res.error);
        setError(res.error || "Error al obtener cuentas MT5");
      }
    } catch (err: unknown) {
      console.error("MT5AccountsTable: Error en catch:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error inesperado";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSaveAccount = async (
    accountId: number,
    updateData: Partial<MT5Account>
  ) => {
    try {
      const result = await window.electronAPI.updateMT5Account(
        accountId,
        updateData
      );

      if (result.success) {
        // Recargar datos desde la base de datos
        await loadAccounts();

        // Emitir evento personalizado para notificar otros componentes
        window.dispatchEvent(
          new CustomEvent("mt5AccountsUpdated", {
            detail: { accountId, updateData },
          })
        );

        toast.success("Cuenta actualizada correctamente");
        setEditingAccount(null); // Cerrar el modal
      } else {
        throw new Error(result.error || "Error al actualizar la cuenta");
      }
    } catch (error) {
      console.error("Error updating account:", error);
      toast.error("Error al actualizar la cuenta");
      throw error;
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const getBadgeConfig = (accountType: string) => {
      switch (accountType.toLowerCase()) {
        case "demo":
          return {
            variant: "secondary" as const,
            className:
              "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
            label: "Demo",
          };
        case "live":
          return {
            variant: "default" as const,
            className:
              "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800",
            label: "Live",
          };
        case "challenge":
          return {
            variant: "outline" as const,
            className:
              "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
            label: "Challenge",
          };
        case "funded":
          return {
            variant: "outline" as const,
            className:
              "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
            label: "Funded",
          };
        default:
          return {
            variant: "secondary" as const,
            className: "bg-muted text-muted-foreground border-border",
            label: type,
          };
      }
    };

    const config = getBadgeConfig(type);

    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPLBadge = (pnl: number) => {
    if (pnl > 0) {
      return (
        <Badge
          variant='default'
          className='bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 flex items-center gap-1'>
          <TrendingUp className='w-3 h-3' />
          +${pnl.toFixed(2)}
        </Badge>
      );
    } else if (pnl < 0) {
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-1'>
          <TrendingDown className='w-3 h-3' />
          -${Math.abs(pnl).toFixed(2)}
        </Badge>
      );
    } else {
      return (
        <Badge
          variant='secondary'
          className='bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1'>
          <Minus className='w-3 h-3' />
          $0.00
        </Badge>
      );
    }
  };

  return (
    <>
      {/* <div className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Cuentas MT5 Importadas
        </h1>
        <p className='text-gray-600'>Resumen de tus cuentas de MetaTrader 5</p>
      </div> */}

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <div className='text-red-600'>{error}</div>
        </div>
      )}

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-muted-foreground'>Cargando cuentas...</p>
          </div>
        </div>
      ) : (
        <div className='bg-card rounded-lg shadow-sm border overflow-hidden'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead className='text-left w-[120px] font-semibold text-foreground'>
                  Login
                </TableHead>
                <TableHead className='text-left w-[150px] font-semibold text-foreground'>
                  Nombre
                </TableHead>
                <TableHead className='text-left w-[130px] font-semibold text-foreground'>
                  Compañía
                </TableHead>
                <TableHead className='text-left w-[80px] font-semibold text-foreground'>
                  Moneda
                </TableHead>
                <TableHead className='text-left w-[140px] font-semibold text-foreground'>
                  Tipo
                </TableHead>
                <TableHead className='text-left w-[120px] font-semibold text-foreground'>
                  Balance Inicial
                </TableHead>
                <TableHead className='text-left w-[120px] font-semibold text-foreground'>
                  Balance Actual
                </TableHead>
                <TableHead className='text-left w-[120px] font-semibold text-foreground'>
                  P&L
                </TableHead>
                <TableHead className='text-left w-[150px] font-semibold text-foreground'>
                  Fecha Creación
                </TableHead>
                <TableHead className='text-center w-[80px] font-semibold text-foreground'>
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className='text-center py-12'>
                    <div className='flex flex-col items-center justify-center text-gray-500'>
                      <div className='text-4xl mb-4'>🏦</div>
                      <h3 className='text-lg font-medium mb-2'>
                        No hay cuentas importadas
                      </h3>
                      <p className='text-sm'>
                        Importa tus cuentas MT5 para ver la información aquí
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                accounts.map((acc) => (
                  <TableRow key={acc.account_id} className='hover:bg-muted/50'>
                    <TableCell className='text-left w-[120px] font-medium'>
                      <Badge variant='outline' className='font-mono text-xs'>
                        {acc.account_id}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-left w-[150px]'>
                      {acc.account_name}
                    </TableCell>
                    <TableCell className='text-left w-[130px]'>
                      {acc.company}
                    </TableCell>
                    <TableCell className='text-left w-[80px]'>
                      <Badge variant='outline' className='font-mono'>
                        {acc.currency}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-left w-[140px]'>
                      {getAccountTypeBadge(acc.type)}
                    </TableCell>
                    <TableCell className='text-left w-[120px] font-medium'>
                      $
                      {acc.initial_balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className='text-left w-[120px] font-medium'>
                      $
                      {acc.current_balance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </TableCell>
                    <TableCell className='text-left w-[120px]'>
                      {getPLBadge(acc.pnl)}
                    </TableCell>
                    <TableCell className='text-left w-[150px] font-medium'>
                      {formatAccountDate(acc.created_at)}
                    </TableCell>
                    <TableCell className='text-center w-[80px]'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => setEditingAccount(acc)}>
                        <Edit className='w-4 h-4' />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal para editar cuenta */}
      <MT5AccountEditModal
        account={editingAccount}
        isOpen={editingAccount !== null}
        onSave={handleSaveAccount}
        onClose={() => setEditingAccount(null)}
      />
    </>
  );
};

export default MT5AccountsTable;
