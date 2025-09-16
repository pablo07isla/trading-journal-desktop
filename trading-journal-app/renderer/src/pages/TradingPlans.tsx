import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Target,
  Activity,
  CheckCircle,
  Clock,
} from "lucide-react";
import { TradingPlanForm } from "@/components/forms/TradingPlanForm";
import type { TradingPlanData, PlanProgress } from "@/types/electron";

export function TradingPlans() {
  const [plans, setPlans] = useState<TradingPlanData[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<TradingPlanData[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<TradingPlanData | null>(
    null
  );
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [planProgress, setPlanProgress] = useState<{
    [key: number]: PlanProgress;
  }>({});

  const filterPlans = () => {
    let filtered = plans;

    if (searchTerm) {
      filtered = filtered.filter(
        (plan) =>
          plan.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.tipo_trader?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          plan.strategy_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter === "activo") {
      filtered = filtered.filter((plan) => plan.activo);
    } else if (statusFilter === "inactivo") {
      filtered = filtered.filter((plan) => !plan.activo);
    }
    // Si statusFilter === "all", no aplicamos filtro adicional

    setFilteredPlans(filtered);
  };

  const loadProgressForActivePlans = React.useCallback(
    async (allPlans: TradingPlanData[]) => {
      const activePlans = allPlans.filter((plan) => plan.activo && plan.id);
      const progressData: { [key: number]: PlanProgress } = {};

      for (const plan of activePlans) {
        try {
          const result = await window.electronAPI.getPlanProgress(plan.id!);
          if (result.success && result.data) {
            progressData[plan.id!] = result.data;
          }
        } catch (error) {
          console.error(`Error loading progress for plan ${plan.id}:`, error);
        }
      }

      setPlanProgress(progressData);
    },
    []
  );

  const loadPlans = React.useCallback(async () => {
    try {
      setLoading(true);
      const result = await window.electronAPI.getTradingPlans();
      if (result.success) {
        setPlans(result.data || []);
        // Cargar progreso para planes activos
        await loadProgressForActivePlans(result.data || []);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Error al cargar los planes de trading");
    } finally {
      setLoading(false);
    }
  }, [loadProgressForActivePlans]);

  useEffect(() => {
    const fetchPlans = async () => {
      await loadPlans();
    };
    fetchPlans();
  }, [loadPlans]);

  useEffect(() => {
    filterPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plans, searchTerm, statusFilter]);

  const handleCreatePlan = () => {
    setSelectedPlan(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditPlan = (plan: TradingPlanData) => {
    setSelectedPlan(plan);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDeletePlan = async (plan: TradingPlanData) => {
    if (!plan.id) return;

    if (
      confirm(`¿Estás seguro de que quieres eliminar el plan "${plan.nombre}"?`)
    ) {
      try {
        const result = await window.electronAPI.deleteTradingPlan(plan.id);
        if (result.success) {
          toast.success("Plan eliminado exitosamente");
          await loadPlans();
        } else {
          throw new Error(result.error);
        }
      } catch (error: unknown) {
        console.error("Error deleting plan:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Error desconocido";
        toast.error(`Error al eliminar el plan: ${errorMessage}`);
      }
    }
  };

  const handleSubmitPlan = async (planData: TradingPlanData) => {
    try {
      if (isEditing && selectedPlan?.id) {
        const result = await window.electronAPI.updateTradingPlan({
          ...planData,
          id: selectedPlan.id,
        });
        if (!result.success) {
          throw new Error(result.error);
        }
      } else {
        const result = await window.electronAPI.createTradingPlan(planData);
        if (!result.success) {
          throw new Error(result.error);
        }
      }

      setIsFormOpen(false);
      await loadPlans();
    } catch (error: unknown) {
      console.error("Error saving plan:", error);
      throw error; // Re-throw para que el formulario maneje el error
    }
  };

  const getStatusBadge = (activo: boolean) => {
    return activo ? (
      <Badge className='bg-green-100 text-green-800 border-green-200'>
        <CheckCircle className='w-3 h-3 mr-1' />
        Activo
      </Badge>
    ) : (
      <Badge className='bg-gray-100 text-gray-800 border-gray-200'>
        <Clock className='w-3 h-3 mr-1' />
        Inactivo
      </Badge>
    );
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "-";
    return `$${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getRiskColor = (currentRisk: number, maxRisk: number) => {
    const riskPercentage = (currentRisk / maxRisk) * 100;
    if (riskPercentage >= 80) return "text-red-600";
    if (riskPercentage >= 60) return "text-yellow-600";
    return "text-green-600";
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='w-full space-y-6 p-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900 flex items-center gap-2'>
            <Target className='w-6 h-6 text-blue-600' />
            Planes de Trading
          </h1>
          <p className='text-gray-600 mt-1'>
            Gestiona tus planes de trading con objetivos y reglas definidas
          </p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={handleCreatePlan}
              className='bg-blue-600 hover:bg-blue-700'>
              <Plus className='w-4 h-4 mr-2' />
              Nuevo Plan
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
            <TradingPlanForm
              plan={selectedPlan || undefined}
              onSubmit={handleSubmitPlan}
              onCancel={() => setIsFormOpen(false)}
              isEditing={isEditing}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Plans activos - Cards */}
      {plans.filter((plan) => plan.activo).length > 0 && (
        <div className='mb-8'>
          <h2 className='text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2'>
            <Activity className='w-5 h-5 text-green-600' />
            Planes Activos
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {plans
              .filter((plan) => plan.activo)
              .map((plan) => {
                const progress = planProgress[plan.id!];
                return (
                  <Card
                    key={plan.id}
                    className='bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200'>
                    <CardHeader className='pb-3'>
                      <CardTitle className='text-lg flex items-center justify-between'>
                        <span className='truncate'>{plan.nombre}</span>
                        <div className='flex gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditPlan(plan)}>
                            <Edit className='w-4 h-4' />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='text-xs text-gray-600'>Tipo Trader</p>
                          <p className='font-semibold'>
                            {plan.tipo_trader || "-"}
                          </p>
                        </div>
                        <div>
                          <p className='text-xs text-gray-600'>Riesgo/Día</p>
                          <p className='font-semibold'>
                            {plan.riesgo_max_diario_pct
                              ? `${plan.riesgo_max_diario_pct}%`
                              : "-"}
                          </p>
                        </div>
                      </div>

                      <div className='grid grid-cols-2 gap-4'>
                        <div>
                          <p className='text-xs text-gray-600'>Max Ops/Día</p>
                          <p className='font-semibold'>
                            {plan.max_operaciones_dia || "-"}
                          </p>
                        </div>
                        <div>
                          <p className='text-xs text-gray-600'>Riesgo/Op</p>
                          <p className='font-semibold'>
                            {plan.riesgo_por_operacion_pct
                              ? `${plan.riesgo_por_operacion_pct}%`
                              : "-"}
                          </p>
                        </div>
                      </div>

                      {progress && (
                        <div className='space-y-2'>
                          <div>
                            <div className='flex justify-between text-xs'>
                              <span>Operaciones Hoy</span>
                              <span className='font-semibold'>
                                {progress.operacionesHoy || 0} /{" "}
                                {plan.max_operaciones_dia || "-"}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className='flex justify-between text-xs'>
                              <span>Riesgo Disponible</span>
                              <span
                                className={getRiskColor(
                                  progress.riesgoActual || 0,
                                  plan.riesgo_max_diario_pct || 100
                                )}>
                                {progress.riesgoDisponible
                                  ? `${progress.riesgoDisponible.toFixed(1)}%`
                                  : "-"}
                              </span>
                            </div>
                            <div className='w-full bg-gray-200 rounded-full h-2'>
                              <div
                                className={`h-2 rounded-full transition-all ${
                                  ((progress.riesgoActual || 0) /
                                    (plan.riesgo_max_diario_pct || 1)) *
                                    100 >
                                  80
                                    ? "bg-red-500"
                                    : ((progress.riesgoActual || 0) /
                                        (plan.riesgo_max_diario_pct || 1)) *
                                        100 >
                                      60
                                    ? "bg-yellow-500"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${Math.min(
                                    ((progress.riesgoActual || 0) /
                                      (plan.riesgo_max_diario_pct || 1)) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          </div>
                          <div className='grid grid-cols-2 gap-2 text-xs'>
                            <div>
                              <span className='text-gray-600'>Trades:</span>{" "}
                              {progress.totalTrades}
                            </div>
                            <div>
                              <span className='text-gray-600'>Win Rate:</span>{" "}
                              {progress.winRate.toFixed(1)}%
                            </div>
                            <div>
                              <span className='text-gray-600'>P&L:</span>
                              <span
                                className={
                                  progress.totalProfit >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                                }>
                                {formatCurrency(progress.totalProfit)}
                              </span>
                            </div>
                            <div>
                              <span className='text-gray-600'>Riesgo:</span>
                              <span
                                className={getRiskColor(
                                  progress.riesgoActual,
                                  100
                                )}>
                                {progress.riesgoActual.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className='flex items-center justify-between pt-2 border-t border-blue-200'>
                        <div className='text-xs text-gray-600'>
                          {plan.strategy_nombre && (
                            <span className='bg-white px-2 py-1 rounded text-xs'>
                              {plan.strategy_nombre}
                            </span>
                          )}
                        </div>
                        {getStatusBadge(plan.activo)}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className='flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border'>
        <div className='flex-1'>
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4' />
            <Input
              placeholder='Buscar planes...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-10'
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-full sm:w-48'>
            <SelectValue placeholder='Filtrar por estado' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Todos</SelectItem>
            <SelectItem value='activo'>Activos</SelectItem>
            <SelectItem value='inactivo'>Inactivos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de todos los planes */}
      <div className='bg-white rounded-lg shadow-sm border overflow-hidden'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Plan</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Riesgo Diario</TableHead>
              <TableHead>Max Ops/Día</TableHead>
              <TableHead>R/R Min</TableHead>
              <TableHead>Estrategia</TableHead>
              <TableHead className='text-right'>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPlans.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className='text-center py-8 text-gray-500'>
                  <Target className='w-12 h-12 mx-auto mb-3 text-gray-400' />
                  <p className='text-lg font-medium'>
                    No hay planes de trading
                  </p>
                  <p className='text-sm'>
                    Crea tu primer plan para comenzar a operar con disciplina
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredPlans.map((plan) => (
                <TableRow key={plan.id} className='hover:bg-gray-50'>
                  <TableCell>
                    <div>
                      <p className='font-medium'>{plan.nombre}</p>
                      {plan.instrumentos_principales && (
                        <div className='flex gap-1 mt-1'>
                          {JSON.parse(plan.instrumentos_principales)
                            .slice(0, 3)
                            .map((instrument: string, idx: number) => (
                              <Badge
                                key={idx}
                                variant='outline'
                                className='text-xs'>
                                {instrument}
                              </Badge>
                            ))}
                          {JSON.parse(plan.instrumentos_principales).length >
                            3 && (
                            <Badge variant='outline' className='text-xs'>
                              +
                              {JSON.parse(plan.instrumentos_principales)
                                .length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(plan.activo)}</TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      <Badge variant='secondary' className='text-xs'>
                        {plan.tipo_trader || "No definido"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      <p className='font-medium'>
                        {plan.riesgo_max_diario_pct
                          ? `${plan.riesgo_max_diario_pct}%`
                          : "-"}
                      </p>
                      <p className='text-xs text-gray-600'>
                        {plan.riesgo_por_operacion_pct
                          ? `${plan.riesgo_por_operacion_pct}% por op`
                          : ""}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className='font-medium'>
                      {plan.max_operaciones_dia || "-"}
                    </p>
                    {planProgress[plan.id!] && (
                      <p className='text-xs text-gray-600'>
                        {planProgress[plan.id!].operacionesHoy || 0} ejecutadas
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    <p className='font-medium'>
                      {plan.relacion_rr_minima
                        ? `1:${plan.relacion_rr_minima}`
                        : "-"}
                    </p>
                    {planProgress[plan.id!]?.totalProfit !== undefined && (
                      <p
                        className={`text-xs ${
                          planProgress[plan.id!].totalProfit >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}>
                        P&L:{" "}
                        {formatCurrency(planProgress[plan.id!].totalProfit)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>
                    {plan.strategy_nombre ? (
                      <Badge variant='outline' className='text-xs'>
                        {plan.strategy_nombre}
                      </Badge>
                    ) : (
                      <span className='text-gray-400 text-sm'>-</span>
                    )}
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex items-center gap-1 justify-end'>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleEditPlan(plan)}
                        className='text-blue-600 hover:text-blue-800'>
                        <Edit className='w-4 h-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleDeletePlan(plan)}
                        className='text-red-600 hover:text-red-800'>
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
