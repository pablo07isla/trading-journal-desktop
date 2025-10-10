import React, { useEffect, useState, useCallback } from "react";
import type { TradeData } from "@/types/electron";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import TradeForm from "@/components/forms/TradeForm";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import Pagination from "@/components/Pagination";

interface Trade extends TradeData {
  id: number;
  entryDate: string; // must be string, not string | undefined
  strategy?: string;
  confidence?: string;
}

interface ManualTradesTableProps {
  onTradeCountChange?: (count: number) => void;
}

const ManualTradesTable: React.FC<ManualTradesTableProps> = ({
  onTradeCountChange,
}) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [strategy, setStrategy] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTrade, setEditTrade] = useState<Trade | null>(null);
  const [viewTrade, setViewTrade] = useState<Trade | null>(null);
  const [deleteTradeId, setDeleteTradeId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const loadTrades = useCallback(async () => {
    try {
      const data = await window.electronAPI.getTrades();
      const tradesData = data as Trade[];
      setTrades(tradesData);
      onTradeCountChange?.(tradesData.length);
    } catch (error) {
      console.error("Error loading trades:", error);
    } finally {
      setLoading(false);
    }
  }, [onTradeCountChange]);

  useEffect(() => {
    loadTrades();
  }, [loadTrades]);

  const filteredTrades = trades.filter(
    (t) =>
      (!search || t.symbol?.toLowerCase().includes(search.toLowerCase())) &&
      (!strategy || t.strategy === strategy)
  );

  // Cálculos de paginación
  const totalItems = filteredTrades.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambien los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [search, strategy]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a página 1 cuando cambie el número de items
  };

  const getPLBadge = (pnl: number | undefined) => {
    if (typeof pnl !== "number")
      return <span className='text-muted-foreground'>-</span>;

    if (pnl > 0) {
      return (
        <Badge
          variant='default'
          className='bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 flex items-center gap-1 border-green-200 dark:border-green-800'>
          <TrendingUp className='w-3 h-3' />
          +${pnl.toFixed(2)}
        </Badge>
      );
    } else if (pnl < 0) {
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-1 border-red-200 dark:border-red-800'>
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

  const getResultBadge = (result: string | undefined) => {
    if (result === "SL") {
      return (
        <Badge
          variant='destructive'
          className='bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'>
          Stop Loss
        </Badge>
      );
    }
    if (result === "TP") {
      return (
        <Badge
          variant='default'
          className='bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'>
          Take Profit
        </Badge>
      );
    }
    if (result === "BE") {
      return (
        <Badge
          variant='secondary'
          className='bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'>
          Break Even
        </Badge>
      );
    }
    return <span className='text-muted-foreground'>-</span>;
  };

  const getOrderTypeBadge = (orderType: string) => {
    if (orderType === "BUY") {
      return (
        <Badge
          variant='default'
          className='bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'>
          Buy
        </Badge>
      );
    }
    if (orderType === "SELL") {
      return (
        <Badge
          variant='secondary'
          className='bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800'>
          Sell
        </Badge>
      );
    }
    return <Badge variant='outline'>{orderType}</Badge>;
  };

  const getConfidenceBadge = (confidence: string | undefined) => {
    if (!confidence) return <span className='text-muted-foreground'>-</span>;

    if (confidence === "Alta") {
      return (
        <Badge
          variant='default'
          className='bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'>
          Alta
        </Badge>
      );
    }
    if (confidence === "Media") {
      return (
        <Badge
          variant='secondary'
          className='bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'>
          Media
        </Badge>
      );
    }
    if (confidence === "Baja") {
      return (
        <Badge variant='outline' className='bg-muted/50 text-muted-foreground'>
          Baja
        </Badge>
      );
    }
    return <Badge variant='outline'>{confidence}</Badge>;
  };

  const handleEditTrade = (trade: Trade) => {
    setEditTrade(trade);
    setViewTrade(null);
    setShowModal(true);
  };

  const handleViewTrade = (trade: Trade) => {
    setViewTrade(trade);
    setEditTrade(null);
    setShowModal(true);
  };

  const handleDeleteTrade = async (id: number) => {
    setDeleting(true);
    try {
      await window.electronAPI.deleteTrade(id);
      setDeleteTradeId(null);
      loadTrades();
    } catch (error) {
      console.error("Error deleting trade:", error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      {/* Filtros */}
      <div className='flex flex-wrap gap-4 items-center mb-6 p-4 bg-card rounded-lg shadow-sm border'>
        {/* Buscar por símbolo */}
        <div className='relative flex-1 min-w-[200px] max-w-xs'>
          <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
            <Search className='w-4 h-4' />
          </span>
          <input
            type='text'
            placeholder='Buscar por símbolo...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border rounded-lg bg-background hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring transition-all text-sm'
          />
        </div>

        {/* Filtro por estrategia */}
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          className='px-4 py-2 border rounded-lg bg-background hover:bg-muted/50 focus:bg-background focus:border-primary focus:ring-2 focus:ring-ring transition-all text-sm min-w-[180px]'>
          <option value=''>Todas las estrategias</option>
          <option value='Breakout'>Breakout</option>
          <option value='Reversión'>Reversión</option>
          <option value='Pullback'>Pullback</option>
        </select>

        {/* Botón añadir trade con modal */}
        <Dialog
          open={showModal}
          onOpenChange={(open) => {
            setShowModal(open);
            if (!open) {
              setEditTrade(null);
              setViewTrade(null);
            }
          }}>
          <DialogTrigger asChild>
            <Button className='ml-auto bg-primary hover:bg-primary/90 text-primary-foreground'>
              <Plus className='mr-2 w-4 h-4' />
              Añadir Trade
            </Button>
          </DialogTrigger>

          <DialogContent className='max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden'>
            <div className='p-6 border-b'>
              <DialogHeader>
                <DialogTitle className='text-xl'>
                  {viewTrade
                    ? "Ver Trade"
                    : editTrade
                    ? "Editar Trade"
                    : "Nuevo Trade"}
                </DialogTitle>
              </DialogHeader>
            </div>
            <div className='overflow-y-auto max-h-[calc(95vh-120px)]'>
              <TradeForm
                onTradeAdded={() => {
                  setShowModal(false);
                  setEditTrade(null);
                  setViewTrade(null);
                  loadTrades();
                }}
                onCancel={() => {
                  setShowModal(false);
                  setEditTrade(null);
                  setViewTrade(null);
                }}
                initialTrade={editTrade || viewTrade}
                isEdit={!!editTrade}
                isReadOnly={!!viewTrade}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Confirmación de borrado */}
        {deleteTradeId !== null && (
          <Dialog open={true} onOpenChange={() => setDeleteTradeId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>¿Eliminar trade?</DialogTitle>
              </DialogHeader>
              <p>
                ¿Estás seguro de que deseas eliminar este trade? Esta acción no
                se puede deshacer.
              </p>
              <div className='flex gap-2 justify-end mt-4'>
                <Button variant='ghost' onClick={() => setDeleteTradeId(null)}>
                  Cancelar
                </Button>
                <Button
                  variant='destructive'
                  onClick={() => handleDeleteTrade(deleteTradeId)}
                  disabled={deleting}>
                  {deleting ? "Eliminando..." : "Eliminar"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Tabla */}
      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-muted-foreground'>Cargando operaciones...</p>
          </div>
        </div>
      ) : (
        <div className='bg-card rounded-lg shadow-sm border overflow-hidden'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                <TableHead className='text-left w-[120px] font-semibold text-foreground'>
                  Fecha
                </TableHead>
                <TableHead className='text-left w-[100px] font-semibold text-foreground'>
                  Símbolo
                </TableHead>
                <TableHead className='text-left w-[80px] font-semibold text-foreground'>
                  Tipo
                </TableHead>
                <TableHead className='text-left w-[90px] font-semibold text-foreground'>
                  P/L
                </TableHead>
                <TableHead className='text-left w-[100px] font-semibold text-foreground'>
                  Resultado
                </TableHead>
                <TableHead className='text-left w-[130px] font-semibold text-foreground'>
                  Estrategia
                </TableHead>
                <TableHead className='text-left w-[110px] font-semibold text-foreground'>
                  Confianza
                </TableHead>
                <TableHead className='text-left w-[110px] font-semibold text-foreground'>
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='text-center py-12'>
                    <div className='flex flex-col items-center justify-center text-muted-foreground'>
                      <div className='text-4xl mb-4'>📈</div>
                      <h3 className='text-lg font-medium mb-2'>
                        No hay operaciones
                      </h3>
                      <p className='text-sm'>
                        {search || strategy
                          ? "No se encontraron operaciones con los filtros aplicados"
                          : "¡Agrega tu primer trade para comenzar!"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrades.map((trade) => (
                  <TableRow
                    key={trade.id}
                    className='hover:bg-muted/50 cursor-pointer'
                    onClick={(e) => {
                      // Evitar que el click en los botones de acción dispare el modal
                      if ((e.target as HTMLElement).closest("button")) return;
                      handleViewTrade(trade);
                    }}>
                    <TableCell className='text-left w-[120px] font-medium'>
                      {trade.entryDate
                        ? trade.entryDate.split("-").reverse().join("/")
                        : "-"}
                    </TableCell>
                    <TableCell className='text-left w-[100px]'>
                      <Badge variant='outline' className='font-mono text-xs'>
                        {trade.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-left w-[80px]'>
                      {getOrderTypeBadge(trade.orderType)}
                    </TableCell>
                    <TableCell className='text-left w-[90px]'>
                      {getPLBadge(trade.pnl)}
                    </TableCell>
                    <TableCell className='text-left w-[100px]'>
                      {getResultBadge(trade.result)}
                    </TableCell>
                    <TableCell className='text-left w-[130px]'>
                      {trade.strategy ? (
                        <Badge
                          variant='outline'
                          className='bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'>
                          {trade.strategy}
                        </Badge>
                      ) : (
                        <span className='text-muted-foreground'>-</span>
                      )}
                    </TableCell>
                    <TableCell className='text-left w-[110px]'>
                      {getConfidenceBadge(trade.confidence)}
                    </TableCell>
                    <TableCell className='text-left w-[110px]'>
                      <div className='flex gap-1'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400'
                          aria-label='Editar'
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTrade(trade);
                          }}>
                          <Pencil className='w-3 h-3' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400'
                          aria-label='Eliminar'
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTradeId(trade.id);
                          }}>
                          <Trash2 className='w-3 h-3' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Componente de Paginación */}
          {filteredTrades.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
            />
          )}
        </div>
      )}
    </>
  );
};

export default ManualTradesTable;
