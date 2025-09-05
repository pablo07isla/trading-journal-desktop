import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import type { TradingAccountData } from "@/types/electron";
import { TradingAccountForm } from "@/components/forms/TradingAccountForm";

interface ManualAccountsTableProps {
  onAccountCountChange?: (count: number) => void;
}

const ManualAccountsTable: React.FC<ManualAccountsTableProps> = ({
  onAccountCountChange,
}) => {
  const [accounts, setAccounts] = useState<
    (TradingAccountData & { id: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<
    (TradingAccountData & { id: number }) | null
  >(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [deleteAccountId, setDeleteAccountId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAccounts = useCallback(async () => {
    try {
      const accountsData = await window.electronAPI.getTradingAccounts();
      const typedAccounts = accountsData as (TradingAccountData & {
        id: number;
      })[];
      setAccounts(typedAccounts);
      onAccountCountChange?.(typedAccounts.length);
    } catch (error) {
      console.error("Error loading trading accounts:", error);
      toast.error("Error al cargar las cuentas de trading");
    } finally {
      setIsLoading(false);
    }
  }, [onAccountCountChange]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleCreateAccount = () => {
    setSelectedAccount(null);
    setIsFormOpen(true);
  };

  const handleEditAccount = (account: TradingAccountData & { id: number }) => {
    setSelectedAccount(account);
    setIsFormOpen(true);
  };

  const handleSaveAccount = async (accountData: TradingAccountData) => {
    try {
      if (selectedAccount?.id) {
        await window.electronAPI.updateTradingAccount({
          ...accountData,
          id: selectedAccount.id,
        });
        toast.success("Cuenta actualizada correctamente");
      } else {
        await window.electronAPI.createTradingAccount(accountData);
        toast.success("Cuenta creada correctamente");
      }

      setIsFormOpen(false);
      setSelectedAccount(null);
      await loadAccounts();
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Error al guardar la cuenta");
    }
  };

  const handleDeleteAccount = async (accountId: number) => {
    setDeleteAccountId(accountId);
  };

  const confirmDeleteAccount = async () => {
    if (!deleteAccountId) return;

    setIsDeleting(true);
    try {
      await window.electronAPI.deleteTradingAccount(deleteAccountId);
      toast.success("Cuenta eliminada correctamente");
      setDeleteAccountId(null);
      await loadAccounts();
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Error al eliminar la cuenta");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatBalance = (balance: number | undefined, currency: string) => {
    if (balance === undefined || balance === null) return "-";
    return new Intl.NumberFormat("es-ES", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
    }).format(balance);
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "activa":
        return (
          <Badge
            variant='default'
            className='bg-green-50 text-green-700 border-green-200'>
            Activa
          </Badge>
        );
      case "cerrada":
        return (
          <Badge
            variant='secondary'
            className='bg-gray-50 text-gray-700 border-gray-200'>
            Cerrada
          </Badge>
        );
      case "suspendida":
        return (
          <Badge
            variant='destructive'
            className='bg-red-50 text-red-700 border-red-200'>
            Suspendida
          </Badge>
        );
      case "en_evaluacion":
        return (
          <Badge
            variant='outline'
            className='bg-blue-50 text-blue-700 border-blue-200'>
            En Evaluación
          </Badge>
        );
      default:
        return <Badge variant='secondary'>{estado}</Badge>;
    }
  };

  const getAccountTypeBadge = (tipo: string) => {
    const config = {
      demo: {
        label: "Demo",
        className: "bg-orange-50 text-orange-700 border-orange-200",
      },
      real: {
        label: "Real",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      },
      fondeo: {
        label: "Fondeo",
        className: "bg-purple-50 text-purple-700 border-purple-200",
      },
      practica: {
        label: "Práctica",
        className: "bg-blue-50 text-blue-700 border-blue-200",
      },
    };

    const accountTypeConfig = config[tipo as keyof typeof config] || {
      label: tipo,
      className: "bg-gray-50 text-gray-700 border-gray-200",
    };

    return (
      <Badge variant='outline' className={accountTypeConfig.className}>
        {accountTypeConfig.label}
      </Badge>
    );
  };

  // Filtrar cuentas
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      !searchTerm ||
      account.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.broker.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = !filterStatus || account.estado === filterStatus;
    const matchesType = !filterType || account.tipoCuenta === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2'></div>
          <p className='text-gray-600'>Cargando cuentas...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Filtros y búsqueda */}
      <div className='flex flex-wrap gap-4 items-center mb-6 p-4 bg-white rounded-lg shadow-sm border'>
        {/* Buscar */}
        <div className='relative flex-1 min-w-[200px] max-w-xs'>
          <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'>
            <Search className='w-4 h-4' />
          </span>
          <input
            type='text'
            placeholder='Buscar cuenta o broker...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm'
          />
        </div>

        {/* Filtro por estado */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className='px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm min-w-[140px]'>
          <option value=''>Todos los estados</option>
          <option value='activa'>Activa</option>
          <option value='cerrada'>Cerrada</option>
          <option value='suspendida'>Suspendida</option>
          <option value='en_evaluacion'>En Evaluación</option>
        </select>

        {/* Filtro por tipo */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className='px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-sm min-w-[140px]'>
          <option value=''>Todos los tipos</option>
          <option value='demo'>Demo</option>
          <option value='real'>Real</option>
          <option value='fondeo'>Fondeo</option>
          <option value='practica'>Práctica</option>
        </select>

        {/* Botón nueva cuenta */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreateAccount}
              className='ml-auto bg-blue-600 hover:bg-blue-700 text-white shadow-sm'>
              <Plus className='mr-2 w-4 h-4' />
              Nueva Cuenta
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden'>
            <div className='p-6 border-b'>
              <DialogHeader>
                <DialogTitle className='text-xl'>
                  {selectedAccount ? "Editar Cuenta" : "Nueva Cuenta"}
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className='overflow-y-auto max-h-[calc(95vh-120px)]'>
              <TradingAccountForm
                account={selectedAccount || undefined}
                onSave={handleSaveAccount}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmación de borrado */}
        {deleteAccountId !== null && (
          <Dialog open={true} onOpenChange={() => setDeleteAccountId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar cuenta?</DialogTitle>
              </DialogHeader>
              <p>
                ¿Estás seguro de que deseas eliminar esta cuenta? Esta acción no
                se puede deshacer.
              </p>
              <div className='flex gap-2 justify-end mt-4'>
                <Button
                  variant='ghost'
                  onClick={() => setDeleteAccountId(null)}>
                  Cancelar
                </Button>
                <Button
                  variant='destructive'
                  onClick={confirmDeleteAccount}
                  disabled={isDeleting}>
                  {isDeleting ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabla de cuentas */}
      <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
        <Table>
          <TableHeader className='bg-gray-50'>
            <TableRow>
              <TableHead className='text-left w-[180px] font-semibold text-gray-700'>
                Cuenta
              </TableHead>
              <TableHead className='text-left w-[150px] font-semibold text-gray-700'>
                Broker
              </TableHead>
              <TableHead className='text-left w-[100px] font-semibold text-gray-700'>
                Tipo
              </TableHead>
              <TableHead className='text-left w-[80px] font-semibold text-gray-700'>
                Moneda
              </TableHead>
              <TableHead className='text-left w-[140px] font-semibold text-gray-700'>
                Balance Inicial
              </TableHead>
              <TableHead className='text-left w-[110px] font-semibold text-gray-700'>
                Estado
              </TableHead>
              <TableHead className='text-left w-[110px] font-semibold text-gray-700'>
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-12'>
                  <div className='flex flex-col items-center justify-center text-gray-500'>
                    <div className='text-4xl mb-4'>🏦</div>
                    <h3 className='text-lg font-medium mb-2'>
                      No hay cuentas registradas
                    </h3>
                    <p className='text-sm'>
                      ¡Agrega tu primera cuenta para comenzar!
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAccounts.map((account) => (
                <TableRow key={account.id} className='hover:bg-muted/50'>
                  <TableCell className='text-left w-[180px]'>
                    <div className='font-medium'>{account.nombre}</div>
                    {account.fechaApertura && (
                      <div className='text-sm text-gray-500'>
                        Abierta:{" "}
                        {new Date(account.fechaApertura).toLocaleDateString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className='text-left w-[150px]'>
                    <Badge variant='outline' className='font-mono text-xs'>
                      {account.broker}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-left w-[100px]'>
                    {getAccountTypeBadge(account.tipoCuenta)}
                  </TableCell>
                  <TableCell className='text-left w-[80px]'>
                    <Badge variant='outline' className='font-mono'>
                      {account.moneda}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-left w-[140px]'>
                    {formatBalance(account.balanceInicial, account.moneda)}
                  </TableCell>
                  <TableCell className='text-left w-[110px]'>
                    {getStatusBadge(account.estado)}
                  </TableCell>
                  <TableCell className='text-left w-[110px]'>
                    <div className='flex gap-1'>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600'
                        aria-label='Editar'
                        onClick={() => handleEditAccount(account)}>
                        <Pencil className='w-3 h-3' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600'
                        aria-label='Eliminar'
                        onClick={() => handleDeleteAccount(account.id)}>
                        <Trash2 className='w-3 h-3' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};

export default ManualAccountsTable;
