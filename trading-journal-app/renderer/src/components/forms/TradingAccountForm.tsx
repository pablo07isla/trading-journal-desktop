import React, { useState, useEffect } from "react";
import type { TradingAccountData } from "@/types/electron";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Wallet,
  Building2,
  DollarSign,
  Calendar,
  FileText,
} from "lucide-react";

interface TradingAccountFormProps {
  account?: TradingAccountData & { id: number };
  onSave: (account: TradingAccountData) => Promise<void>;
  onCancel: () => void;
}

export const TradingAccountForm: React.FC<TradingAccountFormProps> = ({
  account,
  onSave,
  onCancel,
}) => {
  const [formData, setFormData] = useState<TradingAccountData>({
    nombre: "",
    broker: "",
    tipoCuenta: "real",
    moneda: "USD",
    balanceInicial: undefined,
    fechaApertura: "",
    estado: "activa",
    notas: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (account) {
      setFormData({
        nombre: account.nombre,
        broker: account.broker,
        tipoCuenta: account.tipoCuenta,
        moneda: account.moneda,
        balanceInicial: account.balanceInicial,
        fechaApertura: account.fechaApertura || "",
        estado: account.estado,
        notas: account.notas || "",
      });
    }
  }, [account]);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.nombre || formData.nombre.trim() === "")
      newErrors.nombre = "El nombre es obligatorio.";
    if (!formData.broker || formData.broker.trim() === "")
      newErrors.broker = "El broker es obligatorio.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Por favor corrige los errores del formulario.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Guardando cuenta...");
    try {
      const dataToSave = {
        ...formData,
        balanceInicial: formData.balanceInicial || undefined,
        fechaApertura: formData.fechaApertura || undefined,
        notas: formData.notas || undefined,
      };

      if (account?.id) {
        await onSave({ ...dataToSave, id: account.id });
        toast.success("Cuenta actualizada correctamente", { id: toastId });
      } else {
        await onSave(dataToSave);
        toast.success("Cuenta creada correctamente", { id: toastId });
      }
      setErrors({});
    } catch {
      toast.error("Ocurrió un error al guardar la cuenta", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 bg-white overflow-x-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Layout horizontal: 3 columnas principales, responsivo */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Columna 1: Información Básica */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Información Básica
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de la Cuenta *
                </label>
                <Input
                  value={formData.nombre}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      nombre: e.target.value,
                    }));
                    if (errors.nombre)
                      setErrors((prev) => ({ ...prev, nombre: "" }));
                  }}
                  placeholder="ej: Cuenta Fondeo FTMO"
                  required
                  className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                    errors.nombre ? "border-red-500" : ""
                  }`}
                />
                {errors.nombre && (
                  <div className="text-red-600 text-xs mt-1">
                    {errors.nombre}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Broker/Empresa *
                </label>
                <Input
                  value={formData.broker}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      broker: e.target.value,
                    }));
                    if (errors.broker)
                      setErrors((prev) => ({ ...prev, broker: "" }));
                  }}
                  placeholder="ej: FTMO, Interactive Brokers"
                  required
                  className={`focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white ${
                    errors.broker ? "border-red-500" : ""
                  }`}
                />
                {errors.broker && (
                  <div className="text-red-600 text-xs mt-1">
                    {errors.broker}
                  </div>
                )}
              </div>
            </div>
          </div>
          {/* Columna 2: Configuración de Cuenta */}
          <div className="bg-green-50 rounded-lg p-6 border border-green-100">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Configuración de Cuenta
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Cuenta *
                </label>
                <Select
                  value={formData.tipoCuenta}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, tipoCuenta: value }))
                  }
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="real">Real</SelectItem>
                    <SelectItem value="fondeo">Fondeo</SelectItem>
                    <SelectItem value="practica">Práctica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Moneda *
                </label>
                <Select
                  value={formData.moneda}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, moneda: value }))
                  }
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - Libra Esterlina</SelectItem>
                    <SelectItem value="AUD">AUD - Dólar Australiano</SelectItem>
                    <SelectItem value="CAD">CAD - Dólar Canadiense</SelectItem>
                    <SelectItem value="CHF">CHF - Franco Suizo</SelectItem>
                    <SelectItem value="JPY">JPY - Yen Japonés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado *
                </label>
                <Select
                  value={formData.estado}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, estado: value }))
                  }
                >
                  <SelectTrigger className="focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activa">Activa</SelectItem>
                    <SelectItem value="cerrada">Cerrada</SelectItem>
                    <SelectItem value="suspendida">Suspendida</SelectItem>
                    <SelectItem value="en_evaluacion">En Evaluación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Balance Inicial
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.balanceInicial || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      balanceInicial: e.target.value
                        ? parseFloat(e.target.value)
                        : undefined,
                    }))
                  }
                  placeholder="0.00"
                  className="focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Apertura
                </label>
                <Input
                  type="date"
                  value={formData.fechaApertura}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fechaApertura: e.target.value,
                    }))
                  }
                  className="focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white"
                />
              </div>
            </div>
          </div>
          {/* Columna 3: Notas Adicionales */}
          <div className="bg-purple-50 rounded-lg p-6 border border-purple-100">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Información Adicional
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas y Observaciones
                </label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, notas: e.target.value }))
                  }
                  placeholder="Observaciones adicionales sobre la cuenta..."
                  rows={4}
                  className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white resize-none"
                  spellCheck={true}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Botones de Acción */}
        <div className="flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="px-6 hover:bg-gray-50"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              Object.values(errors).some((e) => e) ||
              !formData.nombre ||
              !formData.broker
            }
            className="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-50"
          >
            {isSubmitting
              ? "Guardando..."
              : account
              ? "Actualizar Cuenta"
              : "Crear Cuenta"}
          </Button>
        </div>
      </form>
    </div>
  );
};
