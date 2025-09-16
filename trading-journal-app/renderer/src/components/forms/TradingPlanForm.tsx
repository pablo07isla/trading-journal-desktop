import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  TrendingUp,
  CheckCircle,
  Brain,
  Settings,
  Globe,
  Shield,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type {
  TradingPlanData,
  StrategyData,
  MarketSession,
  TipoTrader,
} from "@/types/electron";

interface TradingPlanFormProps {
  plan?: TradingPlanData;
  onSubmit: (planData: TradingPlanData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

interface FormData {
  nombre: string;
  activo: boolean;

  // Información general
  tipo_trader: string;

  // Capital y gestión de riesgo
  riesgo_max_diario_pct: string;
  max_operaciones_dia: string;
  riesgo_por_operacion_pct: string;
  relacion_rr_minima: string;
  perdida_max_semanal_pct: string;

  // Mercados
  mercados_operacion: MarketSession[];
  instrumentos_principales: string[];
  horario_operacion_inicio: string;
  horario_operacion_fin: string;

  // Reglas
  reglas_personales: string[];
  strategy_id: string;
}

export function TradingPlanForm({
  plan,
  onSubmit,
  onCancel,
  isEditing = false,
}: TradingPlanFormProps) {
  const [formData, setFormData] = useState<FormData>({
    nombre: plan?.nombre || "",
    activo: plan?.activo ?? true,

    // Información general
    tipo_trader: plan?.tipo_trader || "",

    // Capital y gestión de riesgo
    riesgo_max_diario_pct: plan?.riesgo_max_diario_pct?.toString() || "",
    max_operaciones_dia: plan?.max_operaciones_dia?.toString() || "",
    riesgo_por_operacion_pct: plan?.riesgo_por_operacion_pct?.toString() || "",
    relacion_rr_minima: plan?.relacion_rr_minima?.toString() || "",
    perdida_max_semanal_pct: plan?.perdida_max_semanal_pct?.toString() || "",

    // Mercados
    mercados_operacion: plan?.mercados_operacion
      ? JSON.parse(plan.mercados_operacion)
      : [],
    instrumentos_principales: plan?.instrumentos_principales
      ? JSON.parse(plan.instrumentos_principales)
      : [],
    horario_operacion_inicio: plan?.horario_operacion_inicio || "",
    horario_operacion_fin: plan?.horario_operacion_fin || "",

    // Reglas
    reglas_personales: plan?.reglas_personales
      ? JSON.parse(plan.reglas_personales)
      : [],
    strategy_id: plan?.strategy_id?.toString() || "none",
  });

  const [strategies, setStrategies] = useState<StrategyData[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [newRule, setNewRule] = useState("");
  const [newInstrument, setNewInstrument] = useState("");

  // Cargar estrategias disponibles
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const strategiesData = await window.electronAPI.getStrategies();
        setStrategies(strategiesData || []);
      } catch (error) {
        console.error("Error cargando estrategias:", error);
        toast.error("Error al cargar las estrategias");
      }
    };
    loadStrategies();
  }, []);

  // Calcular automáticamente el riesgo por operación
  useEffect(() => {
    const riesgoDiario = parseFloat(formData.riesgo_max_diario_pct);
    const maxOperaciones = parseInt(formData.max_operaciones_dia);

    if (riesgoDiario && maxOperaciones && maxOperaciones > 0) {
      const riesgoPorOperacion = (riesgoDiario / maxOperaciones).toFixed(2);
      if (formData.riesgo_por_operacion_pct !== riesgoPorOperacion) {
        setFormData((prev) => ({
          ...prev,
          riesgo_por_operacion_pct: riesgoPorOperacion,
        }));
      }
    }
  }, [
    formData.riesgo_max_diario_pct,
    formData.max_operaciones_dia,
    formData.riesgo_por_operacion_pct,
  ]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    // Validar tipo de trader
    if (!formData.tipo_trader) {
      newErrors.tipo_trader = "Selecciona el tipo de trader";
    }

    // Validar riesgo máximo diario
    if (
      formData.riesgo_max_diario_pct &&
      (parseFloat(formData.riesgo_max_diario_pct) <= 0 ||
        parseFloat(formData.riesgo_max_diario_pct) > 10)
    ) {
      newErrors.riesgo_max_diario_pct =
        "El riesgo diario debe estar entre 0.1% y 10%";
    }

    // Validar número máximo de operaciones
    if (
      formData.max_operaciones_dia &&
      (parseInt(formData.max_operaciones_dia) <= 0 ||
        parseInt(formData.max_operaciones_dia) > 100)
    ) {
      newErrors.max_operaciones_dia = "Debe ser entre 1 y 100 operaciones";
    }

    // Validar relación R/R
    if (
      formData.relacion_rr_minima &&
      parseFloat(formData.relacion_rr_minima) < 0.5
    ) {
      newErrors.relacion_rr_minima = "La relación R/R debe ser al menos 0.5";
    }

    // Validar pérdida máxima semanal
    if (
      formData.perdida_max_semanal_pct &&
      parseFloat(formData.perdida_max_semanal_pct) <= 0
    ) {
      newErrors.perdida_max_semanal_pct =
        "La pérdida semanal debe ser mayor a 0%";
    }

    // Validar coherencia entre riesgo diario y semanal
    const riesgoDiario = parseFloat(formData.riesgo_max_diario_pct);
    const perdidaSemanal = parseFloat(formData.perdida_max_semanal_pct);

    if (riesgoDiario && perdidaSemanal && riesgoDiario * 5 > perdidaSemanal) {
      newErrors.perdida_max_semanal_pct =
        "La pérdida semanal debe ser al menos 5 veces el riesgo diario";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Por favor corrige los errores del formulario.");
      return;
    }

    const toastId = toast.loading(
      isEditing ? "Actualizando plan..." : "Creando plan..."
    );

    try {
      const planData: TradingPlanData = {
        ...plan,
        nombre: formData.nombre,
        activo: formData.activo,

        // Información general
        tipo_trader: formData.tipo_trader as TipoTrader,

        // Capital y gestión de riesgo
        riesgo_max_diario_pct: formData.riesgo_max_diario_pct
          ? parseFloat(formData.riesgo_max_diario_pct)
          : undefined,
        max_operaciones_dia: formData.max_operaciones_dia
          ? parseInt(formData.max_operaciones_dia)
          : undefined,
        riesgo_por_operacion_pct: formData.riesgo_por_operacion_pct
          ? parseFloat(formData.riesgo_por_operacion_pct)
          : undefined,
        relacion_rr_minima: formData.relacion_rr_minima
          ? parseFloat(formData.relacion_rr_minima)
          : undefined,
        perdida_max_semanal_pct: formData.perdida_max_semanal_pct
          ? parseFloat(formData.perdida_max_semanal_pct)
          : undefined,

        // Mercados y horarios
        mercados_operacion:
          formData.mercados_operacion.length > 0
            ? JSON.stringify(formData.mercados_operacion)
            : undefined,
        instrumentos_principales:
          formData.instrumentos_principales.length > 0
            ? JSON.stringify(formData.instrumentos_principales)
            : undefined,
        horario_operacion_inicio:
          formData.horario_operacion_inicio || undefined,
        horario_operacion_fin: formData.horario_operacion_fin || undefined,

        // Reglas y estrategia
        reglas_personales:
          formData.reglas_personales.length > 0
            ? JSON.stringify(formData.reglas_personales)
            : undefined,
        strategy_id:
          formData.strategy_id && formData.strategy_id !== "none"
            ? parseInt(formData.strategy_id)
            : undefined,
      };

      await onSubmit(planData);
      toast.success(
        isEditing
          ? "Plan actualizado exitosamente"
          : "Plan creado exitosamente",
        { id: toastId }
      );
    } catch (error) {
      console.error("Error al guardar plan:", error);
      toast.error("Ocurrió un error al guardar el plan", { id: toastId });
    }
  };

  const handleInputChange = (
    field: keyof FormData,
    value: string | boolean | MarketSession[] | string[]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error si existe
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleMarketToggle = (market: MarketSession) => {
    const newMarkets = formData.mercados_operacion.includes(market)
      ? formData.mercados_operacion.filter((m) => m !== market)
      : [...formData.mercados_operacion, market];

    handleInputChange("mercados_operacion", newMarkets);
  };

  const addRule = () => {
    if (newRule.trim()) {
      handleInputChange("reglas_personales", [
        ...formData.reglas_personales,
        newRule.trim(),
      ]);
      setNewRule("");
    }
  };

  const removeRule = (index: number) => {
    handleInputChange(
      "reglas_personales",
      formData.reglas_personales.filter((_, i) => i !== index)
    );
  };

  const addInstrument = () => {
    if (newInstrument.trim()) {
      handleInputChange("instrumentos_principales", [
        ...formData.instrumentos_principales,
        newInstrument.trim().toUpperCase(),
      ]);
      setNewInstrument("");
    }
  };

  const removeInstrument = (index: number) => {
    handleInputChange(
      "instrumentos_principales",
      formData.instrumentos_principales.filter((_, i) => i !== index)
    );
  };

  return (
    <div className='max-w-4xl mx-auto p-6'>
      <form onSubmit={handleSubmit} className='space-y-8'>
        <div className='flex items-center justify-between mb-6'>
          <h2 className='text-2xl font-bold text-gray-900'>
            {isEditing
              ? "Editar Plan de Trading"
              : "Crear Nuevo Plan de Trading"}
          </h2>
          <Button
            type='button'
            variant='outline'
            onClick={onCancel}
            className='px-4 py-2'>
            Cancelar
          </Button>
        </div>

        {/* 1. Información General */}
        <section className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Target className='w-6 h-6 text-blue-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              1. Información General
            </h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label
                htmlFor='nombre'
                className='block text-sm font-medium text-gray-700 mb-1'>
                Nombre del Plan *
              </label>
              <Input
                id='nombre'
                value={formData.nombre}
                onChange={(e) => handleInputChange("nombre", e.target.value)}
                placeholder='Ej: Plan Scalping EURUSD'
                className={errors.nombre ? "border-red-500" : ""}
              />
              {errors.nombre && (
                <p className='text-sm text-red-600 mt-1'>{errors.nombre}</p>
              )}
            </div>

            <div>
              <label
                htmlFor='tipo_trader'
                className='block text-sm font-medium text-gray-700 mb-1'>
                Tipo de Trader *
              </label>
              <Select
                value={formData.tipo_trader}
                onValueChange={(value) =>
                  handleInputChange("tipo_trader", value)
                }>
                <SelectTrigger
                  className={errors.tipo_trader ? "border-red-500" : ""}>
                  <SelectValue placeholder='Selecciona tu estilo' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='Scalper'>Scalper</SelectItem>
                  <SelectItem value='Intraday'>Intraday</SelectItem>
                  <SelectItem value='Swing'>Swing</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_trader && (
                <p className='text-sm text-red-600 mt-1'>
                  {errors.tipo_trader}
                </p>
              )}
            </div>
          </div>

          <div className='mt-4'>
            <label className='flex items-center gap-2'>
              <Checkbox
                checked={formData.activo}
                onCheckedChange={(checked: boolean) =>
                  handleInputChange("activo", checked)
                }
              />
              <span className='text-sm text-gray-700'>Plan activo</span>
            </label>
          </div>
        </section>

        {/* 2. Capital y Gestión de Riesgo */}
        <section className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Shield className='w-6 h-6 text-red-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              2. Capital y Gestión de Riesgo
            </h3>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            <div>
              <label
                htmlFor='riesgo_max_diario_pct'
                className='block text-sm font-medium text-gray-700 mb-1'>
                Riesgo Máximo Diario (%)
              </label>
              <Input
                id='riesgo_max_diario_pct'
                type='number'
                step='0.1'
                value={formData.riesgo_max_diario_pct}
                onChange={(e) =>
                  handleInputChange("riesgo_max_diario_pct", e.target.value)
                }
                placeholder='2.0'
                className={errors.riesgo_max_diario_pct ? "border-red-500" : ""}
              />
              {errors.riesgo_max_diario_pct && (
                <p className='text-sm text-red-600 mt-1'>
                  {errors.riesgo_max_diario_pct}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='max_operaciones_dia'
                className='block text-sm font-medium text-gray-700 mb-1'>
                Máximo Operaciones/Día
              </label>
              <Input
                id='max_operaciones_dia'
                type='number'
                value={formData.max_operaciones_dia}
                onChange={(e) =>
                  handleInputChange("max_operaciones_dia", e.target.value)
                }
                placeholder='10'
                className={errors.max_operaciones_dia ? "border-red-500" : ""}
              />
              {errors.max_operaciones_dia && (
                <p className='text-sm text-red-600 mt-1'>
                  {errors.max_operaciones_dia}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='riesgo_por_operacion_pct'
                className='block text-sm font-medium text-gray-700 mb-1'>
                Riesgo por Operación (%)
                <span className='text-xs text-gray-500'>(Calculado)</span>
              </label>
              <Input
                id='riesgo_por_operacion_pct'
                value={formData.riesgo_por_operacion_pct}
                disabled
                className='bg-gray-50'
                placeholder='Automático'
              />
            </div>

            <div>
              <label
                htmlFor='relacion_rr_minima'
                className='block text-sm font-medium text-gray-700 mb-1'>
                Relación R/R Mínima
              </label>
              <Input
                id='relacion_rr_minima'
                type='number'
                step='0.1'
                value={formData.relacion_rr_minima}
                onChange={(e) =>
                  handleInputChange("relacion_rr_minima", e.target.value)
                }
                placeholder='1.5'
                className={errors.relacion_rr_minima ? "border-red-500" : ""}
              />
              {errors.relacion_rr_minima && (
                <p className='text-sm text-red-600 mt-1'>
                  {errors.relacion_rr_minima}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor='perdida_max_semanal_pct'
                className='block text-sm font-medium text-gray-700 mb-1'>
                Pérdida Máxima Semanal (%)
              </label>
              <Input
                id='perdida_max_semanal_pct'
                type='number'
                step='0.1'
                value={formData.perdida_max_semanal_pct}
                onChange={(e) =>
                  handleInputChange("perdida_max_semanal_pct", e.target.value)
                }
                placeholder='5.0'
                className={
                  errors.perdida_max_semanal_pct ? "border-red-500" : ""
                }
              />
              {errors.perdida_max_semanal_pct && (
                <p className='text-sm text-red-600 mt-1'>
                  {errors.perdida_max_semanal_pct}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 3. Mercados y Horarios */}
        <section className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Globe className='w-6 h-6 text-green-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              3. Mercados y Horarios
            </h3>
          </div>

          <div className='space-y-4'>
            <div>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Sesiones de Mercado
              </label>
              <div className='flex gap-2 flex-wrap'>
                {(["NY", "Asia", "London"] as MarketSession[]).map((market) => (
                  <Badge
                    key={market}
                    variant={
                      formData.mercados_operacion.includes(market)
                        ? "default"
                        : "outline"
                    }
                    className='cursor-pointer px-3 py-1'
                    onClick={() => handleMarketToggle(market)}>
                    {market}
                  </Badge>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='horario_inicio'
                  className='block text-sm font-medium text-gray-700 mb-1'>
                  Horario de Inicio
                </label>
                <Input
                  id='horario_inicio'
                  type='time'
                  value={formData.horario_operacion_inicio}
                  onChange={(e) =>
                    handleInputChange(
                      "horario_operacion_inicio",
                      e.target.value
                    )
                  }
                />
              </div>
              <div>
                <label
                  htmlFor='horario_fin'
                  className='block text-sm font-medium text-gray-700 mb-1'>
                  Horario de Fin
                </label>
                <Input
                  id='horario_fin'
                  type='time'
                  value={formData.horario_operacion_fin}
                  onChange={(e) =>
                    handleInputChange("horario_operacion_fin", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* 4. Instrumentos de Trading */}
        <section className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <TrendingUp className='w-6 h-6 text-orange-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              4. Instrumentos de Trading
            </h3>
          </div>

          <div className='space-y-4'>
            <div className='flex gap-2'>
              <Input
                value={newInstrument}
                onChange={(e) => setNewInstrument(e.target.value)}
                placeholder='Ej: EURUSD, GBPUSD...'
                onKeyPress={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addInstrument())
                }
              />
              <Button type='button' onClick={addInstrument} variant='outline'>
                <Plus className='w-4 h-4' />
              </Button>
            </div>

            {formData.instrumentos_principales.length > 0 && (
              <div className='flex gap-2 flex-wrap'>
                {formData.instrumentos_principales.map((instrument, index) => (
                  <Badge
                    key={index}
                    variant='secondary'
                    className='px-3 py-1 gap-2'>
                    {instrument}
                    <X
                      className='w-3 h-3 cursor-pointer'
                      onClick={() => removeInstrument(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 5. Psicología y Disciplina */}
        <section className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Brain className='w-6 h-6 text-purple-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              5. Psicología y Disciplina
            </h3>
          </div>

          <div className='space-y-4'>
            <div className='flex gap-2'>
              <Textarea
                value={newRule}
                onChange={(e) => setNewRule(e.target.value)}
                placeholder='Escribe una regla personal...'
                className='min-h-[80px]'
              />
              <Button type='button' onClick={addRule} variant='outline'>
                <Plus className='w-4 h-4' />
              </Button>
            </div>

            {formData.reglas_personales.length > 0 && (
              <div className='space-y-2'>
                {formData.reglas_personales.map((rule, index) => (
                  <div
                    key={index}
                    className='flex items-start gap-2 p-3 bg-gray-50 rounded-md'>
                    <span className='text-sm text-gray-700 flex-1'>{rule}</span>
                    <X
                      className='w-4 h-4 cursor-pointer text-gray-400 hover:text-red-500 mt-0.5'
                      onClick={() => removeRule(index)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 6. Estrategia */}
        <section className='bg-white rounded-lg border border-gray-200 p-6'>
          <div className='flex items-center gap-3 mb-4'>
            <Settings className='w-6 h-6 text-indigo-600' />
            <h3 className='text-lg font-semibold text-gray-900'>
              6. Estrategia
            </h3>
          </div>

          <div>
            <label
              htmlFor='strategy'
              className='block text-sm font-medium text-gray-700 mb-1'>
              Estrategia a Utilizar
            </label>
            <Select
              value={formData.strategy_id}
              onValueChange={(value) =>
                handleInputChange("strategy_id", value)
              }>
              <SelectTrigger>
                <SelectValue placeholder='Selecciona una estrategia' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>Sin estrategia específica</SelectItem>
                {strategies.map((strategy) => (
                  <SelectItem
                    key={strategy.id}
                    value={strategy.id?.toString() || ""}>
                    {strategy.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-gray-500 mt-1'>
              * Futura implementación: Checklist automático basado en la
              estrategia seleccionada
            </p>
          </div>
        </section>

        {/* Botones */}
        <div className='flex justify-end gap-3 pt-6 border-t'>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type='submit'
            className='bg-blue-600 hover:bg-blue-700'
            disabled={Object.values(errors).some((e) => e) || !formData.nombre}>
            <CheckCircle className='w-4 h-4 mr-2' />
            {isEditing ? "Actualizar" : "Crear"} Plan
          </Button>
        </div>
      </form>
    </div>
  );
}
