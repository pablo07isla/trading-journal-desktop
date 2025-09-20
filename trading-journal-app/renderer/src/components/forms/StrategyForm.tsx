import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BookOpen,
  Target,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Archive,
  Settings,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import type { StrategyData } from "@/types/electron";

interface StrategyFormProps {
  strategy?: StrategyData;
  onSubmit: (strategyData: StrategyData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

export function StrategyForm({
  strategy,
  onSubmit,
  onCancel,
  isEditing = false,
}: StrategyFormProps) {
  const [formData, setFormData] = useState<StrategyData>({
    nombre: strategy?.nombre || "",
    descripcion: strategy?.descripcion || "",
    reglas: strategy?.reglas || "",
    estado: strategy?.estado || "activa",
    notas: strategy?.notas || "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case "activa":
        return (
          <CheckCircle className='w-4 h-4 text-green-600 dark:text-green-400' />
        );
      case "inactiva":
        return <AlertCircle className='w-4 h-4 text-muted-foreground' />;
      case "en_desarrollo":
        return <Clock className='w-4 h-4 text-blue-600 dark:text-blue-400' />;
      case "archivada":
        return (
          <Archive className='w-4 h-4 text-yellow-600 dark:text-yellow-400' />
        );
      default:
        return <BookOpen className='w-4 h-4 text-muted-foreground' />;
    }
  };

  const getStatusLabel = (estado: string) => {
    const statusLabels = {
      activa: "Activa",
      inactiva: "Inactiva",
      en_desarrollo: "En Desarrollo",
      archivada: "Archivada",
    };
    return statusLabels[estado as keyof typeof statusLabels] || "Inactiva";
  };

  const getStatusBadge = (estado: string) => {
    const statusConfig = {
      activa: {
        label: "Activa",
        className:
          "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30",
      },
      inactiva: {
        label: "Inactiva",
        className: "bg-muted text-muted-foreground border-border",
      },
      en_desarrollo: {
        label: "En Desarrollo",
        className:
          "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30",
      },
      archivada: {
        label: "Archivada",
        className:
          "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30",
      },
    };

    const config =
      statusConfig[estado as keyof typeof statusConfig] ||
      statusConfig.inactiva;

    return (
      <Badge className={config.className}>
        {getStatusIcon(estado)}
        <span className='ml-2'>{config.label}</span>
      </Badge>
    );
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.estado) {
      newErrors.estado = "El estado es requerido";
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
      isEditing ? "Actualizando estrategia..." : "Guardando estrategia..."
    );
    try {
      await onSubmit(formData);
      toast.success(
        isEditing
          ? "Estrategia actualizada exitosamente"
          : "Estrategia creada exitosamente",
        { id: toastId }
      );
    } catch {
      toast.error("Ocurrió un error al guardar la estrategia", { id: toastId });
    }
  };

  const handleInputChange = (field: keyof StrategyData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  return (
    <div className='w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 bg-card overflow-x-auto'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-foreground mb-2'>
          {isEditing ? "Editar Estrategia" : "Nueva Estrategia"}
        </h2>
        <p className='text-muted-foreground'>
          {isEditing
            ? "Actualiza los datos de tu estrategia"
            : "Completa la información para crear una nueva estrategia de trading"}
        </p>
      </div>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Layout horizontal: 3 columnas principales, responsivo */}
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {/* Columna 1: Información Básica */}
          <div className='bg-muted/50 rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <Tag className='w-5 h-5 text-muted-foreground' />
              <h3 className='text-lg font-semibold text-foreground'>
                Información Básica
              </h3>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2 flex items-center gap-2'>
                  <Target className='w-4 h-4' />
                  Nombre de la Estrategia *
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => handleInputChange("nombre", e.target.value)}
                  placeholder='Ej: Breakout de Soporte/Resistencia'
                  className={`focus:ring-2 focus:ring-ring/20 ${
                    errors.nombre
                      ? "border-destructive focus:border-destructive"
                      : ""
                  }`}
                />
                {errors.nombre && (
                  <div className='flex items-center gap-1 text-destructive text-xs mt-1'>
                    <AlertCircle className='w-3 h-3' />
                    {errors.nombre}
                  </div>
                )}
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2 flex items-center gap-2'>
                  <Settings className='w-4 h-4' />
                  Estado *
                </label>
                <div className='space-y-3'>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) =>
                      handleInputChange("estado", value)
                    }>
                    <SelectTrigger
                      className={`focus:ring-2 focus:ring-ring/20 ${
                        errors.estado ? "border-destructive" : ""
                      }`}>
                      <SelectValue placeholder='Selecciona el estado'>
                        {formData.estado
                          ? getStatusLabel(formData.estado)
                          : "Selecciona el estado"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='activa'>
                        <div className='flex items-center gap-2'>
                          <CheckCircle className='w-4 h-4 text-green-600 dark:text-green-400' />
                          <span>Activa</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='inactiva'>
                        <div className='flex items-center gap-2'>
                          <AlertCircle className='w-4 h-4 text-muted-foreground' />
                          <span>Inactiva</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='en_desarrollo'>
                        <div className='flex items-center gap-2'>
                          <Clock className='w-4 h-4 text-blue-600 dark:text-blue-400' />
                          <span>En Desarrollo</span>
                        </div>
                      </SelectItem>
                      <SelectItem value='archivada'>
                        <div className='flex items-center gap-2'>
                          <Archive className='w-4 h-4 text-yellow-600 dark:text-yellow-400' />
                          <span>Archivada</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.estado && (
                    <div className='flex items-center gap-1 text-destructive text-xs'>
                      <AlertCircle className='w-3 h-3' />
                      {errors.estado}
                    </div>
                  )}
                  {/* Badge del estado seleccionado - solo se muestra aquí */}
                  {formData.estado && (
                    <div className='flex justify-start'>
                      {getStatusBadge(formData.estado)}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Descripción General
                </label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) =>
                    handleInputChange("descripcion", e.target.value)
                  }
                  placeholder='Describe brevemente en qué consiste esta estrategia...'
                  rows={4}
                  className='focus:ring-2 focus:ring-ring/20 resize-none'
                  spellCheck={true}
                />
                {errors.descripcion && (
                  <div className='text-destructive text-xs mt-1'>
                    {errors.descripcion}
                  </div>
                )}
                <p className='text-xs text-muted-foreground mt-1'>
                  Explica cuándo utilizarla y qué mercados son más adecuados
                </p>
              </div>
            </div>
          </div>
          {/* Columna 2: Reglas y Metodología */}
          <div className='bg-blue-50/50 dark:bg-blue-900/10 rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <FileText className='w-5 h-5 text-blue-600 dark:text-blue-400' />
              <h3 className='text-lg font-semibold text-foreground'>
                Reglas y Metodología
              </h3>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Reglas de la Estrategia
                </label>
                <Textarea
                  value={formData.reglas}
                  onChange={(e) => handleInputChange("reglas", e.target.value)}
                  placeholder='Detalla las reglas específicas:&#10;• Condiciones de entrada (señales, indicadores, patrones)&#10;• Condiciones de salida (stop loss, take profit)&#10;• Gestión de riesgo&#10;• Timeframes recomendados&#10;• Indicadores técnicos a utilizar'
                  rows={12}
                  className='focus:ring-2 focus:ring-ring/20 bg-background resize-none'
                  spellCheck={true}
                />
                {errors.reglas && (
                  <div className='text-destructive text-xs mt-1'>
                    {errors.reglas}
                  </div>
                )}
                <p className='text-xs text-muted-foreground mt-1'>
                  Define condiciones de entrada/salida, gestión de riesgo e
                  indicadores
                </p>
              </div>
            </div>
          </div>
          {/* Columna 3: Notas y Observaciones */}
          <div className='bg-green-50/50 dark:bg-green-900/10 rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <BookOpen className='w-5 h-5 text-green-600 dark:text-green-400' />
              <h3 className='text-lg font-semibold text-foreground'>
                Notas y Observaciones
              </h3>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-foreground mb-2'>
                  Notas Adicionales
                </label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => handleInputChange("notas", e.target.value)}
                  placeholder='Incluye cualquier observación adicional:&#10;• Mejoras identificadas&#10;• Resultados históricos&#10;• Condiciones de mercado favorables&#10;• Lecciones aprendidas'
                  rows={12}
                  className='focus:ring-2 focus:ring-ring/20 bg-background resize-none'
                  spellCheck={true}
                />
                {errors.notas && (
                  <div className='text-destructive text-xs mt-1'>
                    {errors.notas}
                  </div>
                )}
                <p className='text-xs text-muted-foreground mt-1'>
                  Reflexiones, mejoras y lecciones aprendidas de esta estrategia
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Botones de acción */}
        <div className='flex gap-3 justify-end pt-6 mt-6 border-t border-border'>
          <Button
            type='button'
            variant='ghost'
            onClick={onCancel}
            className='px-6 py-2 hover:bg-muted'>
            Cancelar
          </Button>
          <Button
            type='submit'
            className='px-8 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-sm'
            disabled={
              Object.values(errors).some((e) => e) ||
              !formData.nombre ||
              !formData.estado
            }>
            <CheckCircle className='w-4 h-4 mr-2' />
            {isEditing ? "Actualizar" : "Crear"} Estrategia
          </Button>
        </div>
      </form>
    </div>
  );
}
