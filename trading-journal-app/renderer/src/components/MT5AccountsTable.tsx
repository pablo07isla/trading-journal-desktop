import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Minus, Edit, Check, X } from "lucide-react";
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

interface MT5Account {
  account_id: number;
  account_name: string;
  company: string;
  currency: string;
  type: string;
  initial_balance: number;
  current_balance: number;
  pnl: number;
  created_at: string;
}

const MT5AccountsTable: React.FC = () => {
  const [accounts, setAccounts] = useState<MT5Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingAccountId, setEditingAccountId] = useState<number | null>(null);
  const [editingType, setEditingType] = useState<string>("");

  const loadAccounts = async () => {
    setLoading(true);
    console.log("MT5AccountsTable: Iniciando carga de cuentas...");
    try {
      const res = await window.electronAPI.getMT5Accounts();
      console.log("MT5AccountsTable: Respuesta recibida:", res);
      if (res.success && res.data) {
        console.log("MT5AccountsTable: Cuentas cargadas:", res.data.length);
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

  const handleEditType = (accountId: number, currentType: string) => {
    setEditingAccountId(accountId);
    setEditingType(currentType);
  };

  const handleSaveType = async (accountId: number) => {
    try {
      const result = await window.electronAPI.updateMT5Account(accountId, {
        type: editingType as "Challenge" | "Funded" | "Live" | "Demo",
      });

      if (result.success) {
        // Actualizar el estado local
        setAccounts((prev) =>
          prev.map((acc) =>
            acc.account_id === accountId
              ? {
                  ...acc,
                  type: editingType as "Challenge" | "Funded" | "Live" | "Demo",
                }
              : acc
          )
        );
        toast.success("Tipo de cuenta actualizado correctamente");
      } else {
        toast.error(result.error || "Error al actualizar la cuenta");
      }
    } catch (error) {
      console.error("Error updating account type:", error);
      toast.error("Error al actualizar la cuenta");
    } finally {
      setEditingAccountId(null);
      setEditingType("");
    }
  };

  const handleCancelEdit = () => {
    setEditingAccountId(null);
    setEditingType("");
  };

  const getAccountTypeBadge = (type: string, accountId: number) => {
    if (editingAccountId === accountId) {
      return (
        <div className='flex items-center gap-1'>
          <select
            value={editingType}
            onChange={(e) => setEditingType(e.target.value)}
            className='px-2 py-1 border border-gray-300 rounded text-xs'>
            <option value='Live'>Live</option>
            <option value='Demo'>Demo</option>
            <option value='Challenge'>Challenge</option>
            <option value='Funded'>Funded</option>
          </select>
          <Button
            size='sm'
            variant='ghost'
            className='h-6 w-6 p-0 hover:bg-green-50'
            onClick={() => handleSaveType(accountId)}>
            <Check className='w-3 h-3 text-green-600' />
          </Button>
          <Button
            size='sm'
            variant='ghost'
            className='h-6 w-6 p-0 hover:bg-red-50'
            onClick={handleCancelEdit}>
            <X className='w-3 h-3 text-red-600' />
          </Button>
        </div>
      );
    }

    const getBadgeConfig = (accountType: string) => {
      switch (accountType.toLowerCase()) {
        case "demo":
          return {
            variant: "secondary" as const,
            className: "bg-blue-50 text-blue-700 border-blue-200",
            label: "Demo",
          };
        case "live":
          return {
            variant: "default" as const,
            className: "bg-green-50 text-green-700 border-green-200",
            label: "Live",
          };
        case "Challenge":
          return {
            variant: "outline" as const,
            className: "bg-purple-50 text-purple-700 border-purple-200",
            label: "Challenge",
          };
        case "Funded":
          return {
            variant: "outline" as const,
            className: "bg-ambar-50 text-purple-700 border-purple-200",
            label: "Funded",
          };
        default:
          return {
            variant: "secondary" as const,
            className: "bg-gray-50 text-gray-700 border-gray-200",
            label: type,
          };
      }
    };

    const config = getBadgeConfig(type);

    return (
      <div className='flex items-center gap-1'>
        <Badge variant={config.variant} className={config.className}>
          {config.label}
        </Badge>
        <Button
          size='sm'
          variant='ghost'
          className='h-6 w-6 p-0 hover:bg-gray-50'
          onClick={() => handleEditType(accountId, type)}>
          <Edit className='w-3 h-3 text-gray-500' />
        </Button>
      </div>
    );
  };

  const getPLBadge = (pnl: number) => {
    if (pnl > 0) {
      return (
        <Badge
          variant='default'
          className='bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1'>
          <TrendingUp className='w-3 h-3' />
          +${pnl.toFixed(2)}
        </Badge>
      );
    } else if (pnl < 0) {
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1'>
          <TrendingDown className='w-3 h-3' />
          -${Math.abs(pnl).toFixed(2)}
        </Badge>
      );
    } else {
      return (
        <Badge
          variant='secondary'
          className='bg-gray-100 text-gray-800 hover:bg-gray-100 flex items-center gap-1'>
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
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
            <p className='text-gray-600'>Cargando cuentas...</p>
          </div>
        </div>
      ) : (
        <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
          <Table>
            <TableHeader className='bg-gray-50'>
              <TableRow>
                <TableHead className='text-left w-[120px] font-semibold text-gray-700'>
                  Login
                </TableHead>
                <TableHead className='text-left w-[150px] font-semibold text-gray-700'>
                  Nombre
                </TableHead>
                <TableHead className='text-left w-[130px] font-semibold text-gray-700'>
                  Compañía
                </TableHead>
                <TableHead className='text-left w-[80px] font-semibold text-gray-700'>
                  Moneda
                </TableHead>
                <TableHead className='text-left w-[140px] font-semibold text-gray-700'>
                  Tipo
                </TableHead>
                <TableHead className='text-left w-[120px] font-semibold text-gray-700'>
                  Balance Inicial
                </TableHead>
                <TableHead className='text-left w-[120px] font-semibold text-gray-700'>
                  Balance Actual
                </TableHead>
                <TableHead className='text-left w-[120px] font-semibold text-gray-700'>
                  P&L
                </TableHead>
                <TableHead className='text-left w-[150px] font-semibold text-gray-700'>
                  Fecha Creación
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
                      {getAccountTypeBadge(acc.type, acc.account_id)}
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
                    <TableCell className='text-left w-[150px] text-sm text-gray-600'>
                      {formatAccountDate(acc.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

export default MT5AccountsTable;
