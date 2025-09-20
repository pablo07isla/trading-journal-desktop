import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import { StrategyForm } from "@/components/forms/StrategyForm";
import type { StrategyData } from "@/types/electron";

export function Strategies() {
  const [strategies, setStrategies] = useState<StrategyData[]>([]);
  const [filteredStrategies, setFilteredStrategies] = useState<StrategyData[]>(
    []
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedStrategy, setSelectedStrategy] = useState<StrategyData | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const filterStrategies = () => {
    let filtered = strategies;

    if (searchTerm) {
      filtered = filtered.filter(
        (strategy) =>
          strategy.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          strategy.descripcion
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          strategy.reglas?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filtered = filtered.filter(
        (strategy) => strategy.estado === statusFilter
      );
    }

    setFilteredStrategies(filtered);
  };

  useEffect(() => {
    loadStrategies();
  }, []);
  useEffect(() => {
    filterStrategies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [strategies, searchTerm, statusFilter]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      const data = await window.electronAPI.getStrategies();
      setStrategies(data);
    } catch (error) {
      console.error("Error loading strategies:", error);
      toast.error("Error al cargar las estrategias");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStrategy = () => {
    setSelectedStrategy(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditStrategy = (strategy: StrategyData) => {
    setSelectedStrategy(strategy);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDeleteStrategy = async (strategy: StrategyData) => {
    if (!strategy.id) return;

    if (
      confirm(
        `¿Estás seguro de que quieres eliminar la estrategia "${strategy.nombre}"?`
      )
    ) {
      try {
        await window.electronAPI.deleteStrategy(strategy.id);
        toast.success("Estrategia eliminada exitosamente");
        await loadStrategies();
      } catch (error: unknown) {
        console.error("Error deleting strategy:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Error al eliminar la estrategia";
        toast.error(errorMessage);
      }
    }
  };

  const handleSubmitStrategy = async (strategyData: StrategyData) => {
    try {
      if (isEditing && selectedStrategy?.id) {
        await window.electronAPI.updateStrategy({
          ...strategyData,
          id: selectedStrategy.id,
        });
        toast.success("Estrategia actualizada exitosamente");
      } else {
        await window.electronAPI.createStrategy(strategyData);
        toast.success("Estrategia creada exitosamente");
      }
      setIsFormOpen(false);
      await loadStrategies();
    } catch (error) {
      console.error("Error saving strategy:", error);
      toast.error("Error al guardar la estrategia");
    }
  };

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "activa":
        return (
          <Badge
            variant='default'
            className='bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30'>
            Activa
          </Badge>
        );
      case "inactiva":
        return (
          <Badge
            variant='secondary'
            className='bg-muted text-muted-foreground border-border'>
            Inactiva
          </Badge>
        );
      case "en_desarrollo":
        return (
          <Badge
            variant='default'
            className='bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30'>
            En Desarrollo
          </Badge>
        );
      case "archivada":
        return (
          <Badge
            variant='secondary'
            className='bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30'>
            Archivada
          </Badge>
        );
      default:
        return (
          <Badge variant='outline' className='bg-muted text-muted-foreground'>
            {estado}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className='p-6 bg-background min-h-screen'>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center py-16'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
              <p className='mt-4 text-muted-foreground'>
                Cargando estrategias...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className='p-6 bg-background min-h-screen'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-6'>
          <h1 className='text-3xl font-bold text-foreground mb-2'>
            Estrategias de Trading
          </h1>
          <p className='text-muted-foreground'>
            Gestiona y organiza todas tus estrategias de trading
          </p>
        </div>
        {/* Filters */}
        <div className='flex flex-wrap gap-4 items-center mb-6 p-4 bg-card rounded-lg shadow-sm border'>
          {/* Buscar por nombre */}
          <div className='relative flex-1 min-w-[200px] max-w-xs'>
            <span className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground'>
              <Search className='w-4 h-4' />
            </span>
            <input
              type='text'
              placeholder='Buscar estrategias...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-muted focus:bg-background focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all text-sm'
            />
          </div>

          {/* Filtro por estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className='px-4 py-2 border border-border rounded-lg bg-muted focus:bg-background focus:border-ring focus:ring-2 focus:ring-ring/20 transition-all text-sm min-w-[180px]'>
            <option value=''>Todos los estados</option>
            <option value='activa'>Activas</option>
            <option value='en_desarrollo'>En Desarrollo</option>
            <option value='inactiva'>Inactivas</option>
            <option value='archivada'>Archivadas</option>
          </select>

          {/* Botón añadir estrategia con modal */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleCreateStrategy}
                className='ml-auto bg-primary hover:bg-primary/90 text-primary-foreground'>
                <Plus className='mr-2 w-4 h-4' />
                Nueva Estrategia
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-[95vw] max-h-[95vh] w-full p-0 overflow-hidden'>
              <div className='p-6 border-b'>
                <h2 className='text-xl font-semibold'>
                  {isEditing ? "Editar Estrategia" : "Nueva Estrategia"}
                </h2>
              </div>
              <div className='overflow-y-auto max-h-[calc(95vh-120px)]'>
                <StrategyForm
                  strategy={selectedStrategy || undefined}
                  onSubmit={handleSubmitStrategy}
                  onCancel={() => setIsFormOpen(false)}
                  isEditing={isEditing}
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>{" "}
        {/* Strategies Table */}
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
              <p className='text-muted-foreground'>Cargando estrategias...</p>
            </div>
          </div>
        ) : (
          <div className='bg-card rounded-lg shadow-sm border overflow-hidden'>
            <Table>
              <TableHeader className='bg-muted/50'>
                <TableRow>
                  <TableHead className='text-left w-[200px] font-semibold text-foreground'>
                    Estrategia
                  </TableHead>
                  <TableHead className='text-left w-[120px] font-semibold text-foreground'>
                    Estado
                  </TableHead>
                  <TableHead className='text-left w-[250px] font-semibold text-foreground'>
                    Descripción
                  </TableHead>
                  <TableHead className='text-left w-[200px] font-semibold text-foreground'>
                    Reglas
                  </TableHead>
                  <TableHead className='text-left w-[200px] font-semibold text-foreground'>
                    Notas
                  </TableHead>
                  <TableHead className='text-left w-[100px] font-semibold text-foreground'>
                    Acciones
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStrategies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className='text-center py-12'>
                      <div className='flex flex-col items-center justify-center text-muted-foreground'>
                        <div className='text-4xl mb-4'>📊</div>
                        <h3 className='text-lg font-medium mb-2 text-foreground'>
                          {searchTerm || statusFilter
                            ? "No se encontraron estrategias"
                            : "No hay estrategias"}
                        </h3>
                        <p className='text-sm'>
                          {searchTerm || statusFilter
                            ? "Intenta modificar los filtros de búsqueda"
                            : "¡Agrega tu primera estrategia para comenzar!"}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStrategies.map((strategy) => (
                    <TableRow
                      key={strategy.id}
                      className='hover:bg-muted/50 transition-colors'>
                      <TableCell className='text-left w-[200px] font-medium'>
                        <div className='font-medium text-foreground'>
                          {strategy.nombre}
                        </div>
                      </TableCell>
                      <TableCell className='text-left w-[120px]'>
                        {getStatusBadge(strategy.estado)}
                      </TableCell>
                      <TableCell className='text-left w-[250px]'>
                        <div className='text-sm text-muted-foreground'>
                          {strategy.descripcion ? (
                            <span>
                              {strategy.descripcion.length > 80
                                ? `${strategy.descripcion.substring(0, 80)}...`
                                : strategy.descripcion}
                            </span>
                          ) : (
                            <span className='text-muted-foreground/70 italic'>
                              Sin descripción
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-left w-[200px]'>
                        <div className='text-sm text-muted-foreground'>
                          {strategy.reglas ? (
                            <span>
                              {strategy.reglas.length > 60
                                ? `${strategy.reglas.substring(0, 60)}...`
                                : strategy.reglas}
                            </span>
                          ) : (
                            <span className='text-muted-foreground/70 italic'>
                              Sin reglas definidas
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-left w-[200px]'>
                        <div className='text-sm text-muted-foreground'>
                          {strategy.notas ? (
                            <span>
                              {strategy.notas.length > 60
                                ? `${strategy.notas.substring(0, 60)}...`
                                : strategy.notas}
                            </span>
                          ) : (
                            <span className='text-muted-foreground/70 italic'>
                              Sin notas
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-left w-[100px]'>
                        <div className='flex gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditStrategy(strategy)}
                            className='h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20'>
                            <Edit className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteStrategy(strategy)}
                            className='h-8 w-8 p-0 hover:bg-red-50 dark:hover:bg-red-900/20'>
                            <Trash2 className='h-4 w-4 text-red-600 dark:text-red-400' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
