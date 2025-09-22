import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Save, X } from "lucide-react";
import { formatAccountDate } from "@/lib/dateUtils";
import { toast } from "sonner";

interface MT5Account {
  account_id: number;
  account_name: string;
  company: string;
  currency: string;
  type: "Challenge" | "Funded" | "Live" | "Demo";
  initial_balance: number;
  current_balance: number;
  pnl: number;
  profit_target_percent?: number;
  stop_target_percent?: number;
  daily_loss_percent?: number;
  created_at: string;
}

interface MT5AccountEditModalProps {
  account: MT5Account | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (accountId: number, updateData: Partial<MT5Account>) => Promise<void>;
}

const MT5AccountEditModal: React.FC<MT5AccountEditModalProps> = ({
  account,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState({
    type: "" as MT5Account['type'],
    profit_target_percent: "",
    stop_target_percent: "",
    daily_loss_percent: "",
  });
  const [loading, setLoading] = useState(false);

  // Reset form when account changes
  useEffect(() => {
    if (account) {
      setFormData({
        type: account.type,
        profit_target_percent: (account.profit_target_percent ?? 0).toString(),
        stop_target_percent: (account.stop_target_percent ?? 0).toString(),
        daily_loss_percent: (account.daily_loss_percent ?? 0).toString(),
      });
    }
  }, [account]);

  const handleSave = async () => {
    if (!account) return;

    // Validations
    const profitTarget = parseFloat(formData.profit_target_percent);
    const stopTarget = parseFloat(formData.stop_target_percent);
    const dailyLoss = parseFloat(formData.daily_loss_percent);

    if (isNaN(profitTarget) || profitTarget < 0 || profitTarget > 100) {
      toast.error("Profit Target debe estar entre 0 y 100%");
      return;
    }

    if (isNaN(stopTarget) || stopTarget < 0 || stopTarget > 100) {
      toast.error("Stop Target debe estar entre 0 y 100%");
      return;
    }

    if (isNaN(dailyLoss) || dailyLoss < 0 || dailyLoss > 100) {
      toast.error("Daily Loss debe estar entre 0 y 100%");
      return;
    }

    setLoading(true);
    try {
      await onSave(account.account_id, {
        type: formData.type,
        profit_target_percent: profitTarget,
        stop_target_percent: stopTarget,
        daily_loss_percent: dailyLoss,
      });
      onClose();
      toast.success("Cuenta actualizada correctamente");
    } catch (error) {
      console.error("Error saving account:", error);
      toast.error("Error al actualizar la cuenta");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getPLBadge = (pnl: number) => {
    if (pnl > 0) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30 flex items-center gap-1"
        >
          <TrendingUp className="w-3 h-3" />
          +${pnl.toFixed(2)}
        </Badge>
      );
    } else if (pnl < 0) {
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30 flex items-center gap-1"
        >
          <TrendingDown className="w-3 h-3" />
          -${Math.abs(pnl).toFixed(2)}
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-muted text-muted-foreground hover:bg-muted/80 flex items-center gap-1"
        >
          <Minus className="w-3 h-3" />
          $0.00
        </Badge>
      );
    }
  };

  if (!account) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Editar Cuenta MT5</span>
            <Badge variant="outline" className="font-mono text-xs">
              {account.account_id}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Modifica la configuración y parámetros de riesgo de tu cuenta de trading.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Info Section */}
          <div className="grid grid-cols-2 gap-4 p-4 border border-border rounded-lg bg-muted/20">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Información General
              </Label>
              <div className="space-y-1">
                <div>
                  <span className="text-sm font-medium">{account.account_name}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {account.company} • {account.currency}
                </div>
                <div className="text-xs text-muted-foreground">
                  Creada: {formatAccountDate(account.created_at)}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wide">
                Balance & P&L
              </Label>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Inicial:</span>
                  <span className="text-sm font-medium">
                    ${account.initial_balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Actual:</span>
                  <span className="text-sm font-medium">
                    ${account.current_balance.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">P&L:</span>
                  {getPLBadge(account.pnl)}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Fields Section */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold text-foreground">
              Configuración de Cuenta
            </Label>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="account-type" className="text-sm">
                Tipo de Cuenta
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange("type", value)}
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="Live">Live</SelectItem>
                  <SelectItem value="Demo">Demo</SelectItem>
                  <SelectItem value="Challenge">Challenge</SelectItem>
                  <SelectItem value="Funded">Funded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Risk Management Section */}
            <div className="space-y-4 p-4 border border-border rounded-lg bg-muted/10">
              <Label className="text-sm font-semibold text-foreground">
                Gestión de Riesgo
              </Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Profit Target */}
                <div className="space-y-2">
                  <Label htmlFor="profit-target" className="text-sm">
                    Profit Target (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="profit-target"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.profit_target_percent}
                      onChange={(e) =>
                        handleInputChange("profit_target_percent", e.target.value)
                      }
                      className="bg-background border-border pr-8"
                      placeholder="0.0"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Meta de ganancias objetivo
                  </p>
                </div>

                {/* Stop Target */}
                <div className="space-y-2">
                  <Label htmlFor="stop-target" className="text-sm">
                    Stop Target (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="stop-target"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.stop_target_percent}
                      onChange={(e) =>
                        handleInputChange("stop_target_percent", e.target.value)
                      }
                      className="bg-background border-border pr-8"
                      placeholder="0.0"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Límite máximo de pérdidas
                  </p>
                </div>

                {/* Daily Loss */}
                <div className="space-y-2">
                  <Label htmlFor="daily-loss" className="text-sm">
                    Daily Loss (%)
                  </Label>
                  <div className="relative">
                    <Input
                      id="daily-loss"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.daily_loss_percent}
                      onChange={(e) =>
                        handleInputChange("daily_loss_percent", e.target.value)
                      }
                      className="bg-background border-border pr-8"
                      placeholder="0.0"
                    />
                    <span className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pérdida máxima diaria permitida
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-border"
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MT5AccountEditModal;