import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Search,
  Edit,
  FileText,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import type { MT5TradeData } from "../types/electron";
import { formatTradeDate } from "@/lib/dateUtils";
import MT5TradeEditForm from "./forms/MT5TradeEditForm";
import { toast } from "sonner";
import Pagination from "@/components/Pagination";

interface MT5TradesTableProps {
  accountId?: number;
}

const MT5TradesTable: React.FC<MT5TradesTableProps> = ({ accountId }) => {
  const [trades, setTrades] = useState<MT5TradeData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingTrade, setEditingTrade] = useState<MT5TradeData | null>(null);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const loadTrades = async () => {
    setLoading(true);
    try {
      const res = await window.electronAPI.getMT5AccountTrades(
        accountId ?? null
      );
      if (res.success && res.data) {
        setTrades(res.data);
      } else {
        setError(res.error || "Error al obtener trades MT5");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  const handleEditTrade = (trade: MT5TradeData) => {
    setEditingTrade(trade);
    setIsEditFormOpen(true);
  };

  const handleSaveTrade = () => {
    toast.success("Trade actualizado exitosamente");
    loadTrades(); // Recargar trades para mostrar cambios
  };

  const handleCloseEditForm = () => {
    setIsEditFormOpen(false);
    setEditingTrade(null);
  };

  // Función para verificar si un trade tiene información adicional
  const hasAdditionalInfo = (trade: MT5TradeData) => {
    return !!(trade.strategy_id || trade.description || trade.notes);
  };

  const getOrderTypeBadge = (orderType: string) => {
    if (orderType === "BUY" || orderType === "Buy") {
      return (
        <Badge
          variant='default'
          className='bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800/30'>
          Buy
        </Badge>
      );
    }
    if (orderType === "SELL" || orderType === "Sell") {
      return (
        <Badge
          variant='secondary'
          className='bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800/30'>
          Sell
        </Badge>
      );
    }
    return <Badge variant='outline'>{orderType}</Badge>;
  };

  const getProfitBadge = (profit: number) => {
    if (profit > 0) {
      return (
        <Badge
          variant='default'
          className='bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 dark:hover:bg-green-900/30 flex items-center gap-1'>
          <TrendingUp className='w-3 h-3' />
          +${profit.toFixed(2)}
        </Badge>
      );
    } else if (profit < 0) {
      return (
        <Badge
          variant='destructive'
          className='bg-red-100 text-red-800 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:hover:bg-red-900/30 flex items-center gap-1'>
          <TrendingDown className='w-3 h-3' />
          -${Math.abs(profit).toFixed(2)}
        </Badge>
      );
    } else {
      return (
        <Badge
          variant='secondary'
          className='bg-muted text-muted-foreground hover:bg-muted flex items-center gap-1'>
          <Minus className='w-3 h-3' />
          $0.00
        </Badge>
      );
    }
  };

  const getCommentBadge = (comment: string | null) => {
    if (!comment || comment.trim() === "") {
      return (
        <Badge
          variant='outline'
          className='bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30'>
          Cierre manual
        </Badge>
      );
    }

    const lowerComment = comment.toLowerCase().trim();

    if (lowerComment.startsWith("[sl")) {
      return (
        <Badge
          variant='destructive'
          className='bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800/30'>
          Stop Loss
        </Badge>
      );
    }

    if (lowerComment.startsWith("[tp")) {
      return (
        <Badge
          variant='default'
          className='bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30'>
          Take Profit
        </Badge>
      );
    }

    // Si no coincide con ningún patrón, mostrar el comentario original
    return <span className='text-sm text-muted-foreground'>{comment}</span>;
  };

  const filteredTrades = trades.filter(
    (trade) =>
      !search || trade.symbol?.toLowerCase().includes(search.toLowerCase())
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
  }, [search]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Resetear a página 1 cuando cambie el número de items
  };

  return (
    <>
      {/* Filtros */}
      <div className='flex flex-wrap gap-4 items-center mb-6 p-4 bg-card rounded-lg shadow-sm border'>
        <div className='relative flex-1 min-w-[200px] max-w-xs'>
          <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
            <Search className='w-4 h-4' />
          </span>
          <input
            type='text'
            placeholder='Buscar por símbolo...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-muted focus:bg-background focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all text-sm'
          />
        </div>
        {accountId && (
          <Badge variant='outline' className='font-mono'>
            Cuenta: {accountId}
          </Badge>
        )}
      </div>

      {error && (
        <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded-lg'>
          <div className='text-red-600'>{error}</div>
        </div>
      )}

      {loading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
            <p className='text-muted-foreground'>Cargando trades...</p>
          </div>
        </div>
      ) : (
        <div className='bg-card rounded-lg shadow-sm border overflow-hidden'>
          <Table>
            <TableHeader className='bg-muted/50'>
              <TableRow>
                {/* <TableHead className='text-left w-[100px] font-semibold text-foreground'>
                  Position ID
                </TableHead> */}
                <TableHead className='text-left w-[100px] font-semibold text-foreground'>
                  Símbolo
                </TableHead>
                <TableHead className='text-left w-[80px] font-semibold text-foreground'>
                  Tipo
                </TableHead>
                <TableHead className='text-left w-[90px] font-semibold text-foreground'>
                  Volumen
                </TableHead>
                <TableHead className='text-left w-[140px] font-semibold text-foreground'>
                  Fecha Apertura
                </TableHead>
                <TableHead className='text-left w-[130px] font-semibold text-foreground'>
                  Precio Apertura
                </TableHead>
                <TableHead className='text-left w-[140px] font-semibold text-foreground'>
                  Fecha Cierre
                </TableHead>
                <TableHead className='text-left w-[130px] font-semibold text-foreground'>
                  Precio Cierre
                </TableHead>

                <TableHead className='text-left w-[100px] font-semibold text-foreground'>
                  Comisión
                </TableHead>
                <TableHead className='text-left w-[120px] font-semibold text-foreground'>
                  Profit
                </TableHead>
                <TableHead className='text-left w-[150px] font-semibold text-foreground'>
                  Comentario
                </TableHead>
                <TableHead className='text-left w-[100px] font-semibold text-foreground'>
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className='text-center py-12'>
                    <div className='flex flex-col items-center justify-center text-muted-foreground'>
                      <div className='text-4xl mb-4'>📊</div>
                      <h3 className='text-lg font-medium mb-2 text-foreground'>
                        {search
                          ? "No se encontraron trades"
                          : "No hay trades importados"}
                      </h3>
                      <p className='text-sm'>
                        {search
                          ? "Intenta con un término de búsqueda diferente"
                          : "Importa tus operaciones MT5 para ver la información aquí"}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedTrades.map((trade) => (
                  <TableRow
                    key={trade.position_id}
                    className='hover:bg-muted/50'>
                    {/* <TableCell className='text-left w-[100px] font-medium'>
                      <Badge variant='outline' className='font-mono text-xs'>
                        {trade.position_id}
                      </Badge>
                    </TableCell> */}
                    <TableCell className='text-left w-[100px]'>
                      <Badge variant='outline' className='font-mono text-xs'>
                        {trade.symbol}
                      </Badge>
                    </TableCell>
                    <TableCell className='text-left w-[80px]'>
                      {getOrderTypeBadge(trade.trade_type)}
                    </TableCell>
                    <TableCell className='text-left w-[90px] font-medium'>
                      {trade.volume}
                    </TableCell>
                    <TableCell className='text-left w-[140px] text-sm text-muted-foreground'>
                      {trade.open_time ? formatTradeDate(trade.open_time) : "-"}
                    </TableCell>
                    <TableCell className='text-left w-[130px] font-mono text-sm'>
                      {trade.open_price.toFixed(5)}
                    </TableCell>
                    <TableCell className='text-left w-[140px] text-sm text-muted-foreground'>
                      {trade.close_time
                        ? formatTradeDate(trade.close_time)
                        : "-"}
                    </TableCell>
                    <TableCell className='text-left w-[130px] font-mono text-sm'>
                      {trade.close_price?.toFixed(5) ?? "-"}
                    </TableCell>

                    <TableCell className='text-left w-[100px]'>
                      <span className='text-sm font-mono'>
                        ${trade.commission.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className='text-left w-[120px]'>
                      {getProfitBadge(trade.profit)}
                    </TableCell>
                    <TableCell className='text-left w-[150px] text-sm text-muted-foreground'>
                      {getCommentBadge(trade.comment ?? null)}
                    </TableCell>
                    <TableCell className='text-left w-[100px]'>
                      <div className='flex items-center gap-2'>
                        {hasAdditionalInfo(trade) && (
                          <Badge
                            variant='outline'
                            className='text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30'>
                            <FileText className='w-3 h-3 mr-1' />
                            Info
                          </Badge>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditTrade(trade)}
                          className='h-8 w-8 p-0'>
                          <Edit className='w-4 h-4' />
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

      {/* Modal de edición */}
      {editingTrade && (
        <MT5TradeEditForm
          trade={editingTrade}
          isOpen={isEditFormOpen}
          onClose={handleCloseEditForm}
          onSave={handleSaveTrade}
        />
      )}
    </>
  );
};

export default MT5TradesTable;
