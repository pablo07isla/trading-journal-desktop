import React from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  itemsPerPageOptions?: number[];
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  itemsPerPageOptions = [10, 25, 50, 100],
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handleFirstPage = () => {
    if (currentPage > 1) {
      onPageChange(1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handleLastPage = () => {
    if (currentPage < totalPages) {
      onPageChange(totalPages);
    }
  };

  return (
    <div className='flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-card border-t'>
      {/* Selector de registros por página */}
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <span>Mostrar</span>
        <select
          value={itemsPerPage}
          onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
          className='px-2 py-1 border border-border rounded-md bg-background focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all text-sm'>
          {itemsPerPageOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span>registros</span>
      </div>

      {/* Información de registros */}
      <div className='text-sm text-muted-foreground'>
        {totalItems === 0 ? (
          <span>No hay registros</span>
        ) : (
          <span>
            Mostrando {startItem} - {endItem} de {totalItems} registros
          </span>
        )}
      </div>

      {/* Controles de navegación */}
      <div className='flex items-center gap-1'>
        <Button
          variant='outline'
          size='sm'
          onClick={handleFirstPage}
          disabled={currentPage === 1 || totalPages === 0}
          className='h-8 w-8 p-0'
          aria-label='Primera página'>
          <ChevronsLeft className='w-4 h-4' />
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={handlePreviousPage}
          disabled={currentPage === 1 || totalPages === 0}
          className='h-8 w-8 p-0'
          aria-label='Página anterior'>
          <ChevronLeft className='w-4 h-4' />
        </Button>

        {/* Indicador de página actual */}
        <div className='flex items-center gap-2 px-3 text-sm'>
          <span className='text-foreground font-medium'>
            {totalPages === 0 ? 0 : currentPage}
          </span>
          <span className='text-muted-foreground'>de</span>
          <span className='text-foreground font-medium'>{totalPages}</span>
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={handleNextPage}
          disabled={currentPage === totalPages || totalPages === 0}
          className='h-8 w-8 p-0'
          aria-label='Página siguiente'>
          <ChevronRight className='w-4 h-4' />
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={handleLastPage}
          disabled={currentPage === totalPages || totalPages === 0}
          className='h-8 w-8 p-0'
          aria-label='Última página'>
          <ChevronsRight className='w-4 h-4' />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
