import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Upload, X, Eye, FileText, Image as ImageIcon } from "lucide-react";
import type {
  MT5TradeData,
  StrategyData,
  MT5TradeAttachment,
  TradingPlanData,
} from "../../types/electron";
import { formatTradeDate } from "@/lib/dateUtils";

interface MT5TradeEditFormProps {
  trade: MT5TradeData;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface EditFormData {
  strategy_id?: number;
  plan_id?: number;
  description?: string;
  notes?: string;
}

const MT5TradeEditForm: React.FC<MT5TradeEditFormProps> = ({
  trade,
  isOpen,
  onClose,
  onSave,
}) => {
  const [formData, setFormData] = useState<EditFormData>({
    strategy_id: trade.strategy_id || undefined,
    plan_id: trade.plan_id || undefined,
    description: trade.description || "",
    notes: trade.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [strategies, setStrategies] = useState<StrategyData[]>([]);
  const [tradingPlans, setTradingPlans] = useState<TradingPlanData[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [attachments, setAttachments] = useState<MT5TradeAttachment[]>([]);

  // Cargar adjuntos existentes
  const loadAttachments = useCallback(async () => {
    try {
      if (!trade.trade_id) return;
      const result = await window.electronAPI.getMT5TradeAttachments(
        trade.trade_id
      );
      if (result.success && result.data) {
        setAttachments(result.data);
      }
    } catch (error) {
      console.error("Error cargando adjuntos:", error);
    }
  }, [trade.trade_id]);

  // Cargar estrategias y planes disponibles
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar estrategias
        const strategiesData = await window.electronAPI.getStrategies();
        setStrategies(strategiesData || []);

        // Cargar planes de trading activos
        const plansResult = await window.electronAPI.getTradingPlans();
        if (plansResult.success) {
          // Solo mostrar planes activos
          const activePlans = (plansResult.data || []).filter(
            (plan) => plan.activo
          );
          setTradingPlans(activePlans);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast.error("Error al cargar estrategias y planes");
      }
    };

    if (isOpen) {
      loadData();
      loadAttachments();
      setFormData({
        strategy_id: trade.strategy_id || undefined,
        plan_id: trade.plan_id || undefined,
        description: trade.description || "",
        notes: trade.notes || "",
      });
    }
  }, [isOpen, trade, loadAttachments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trade.trade_id) {
      toast.error("ID de trade no válido");
      return;
    }

    setLoading(true);

    try {
      // Actualizar información del trade
      const result = await window.electronAPI.updateMT5Trade(
        trade.trade_id,
        formData
      );

      if (!result.success) {
        throw new Error(result.error || "Error al actualizar el trade");
      }

      // Subir archivos si los hay
      for (const file of files) {
        try {
          const buffer = await file.arrayBuffer();
          const attachmentResult =
            await window.electronAPI.saveMT5TradeAttachment(trade.trade_id, {
              buffer,
              originalName: file.name,
              mimeType: file.type,
            });

          if (!attachmentResult.success) {
            console.error("Error subiendo archivo:", attachmentResult.error);
            toast.error(`Error al subir ${file.name}`);
          }
        } catch (error) {
          console.error("Error procesando archivo:", file.name, error);
          toast.error(`Error al procesar ${file.name}`);
        }
      }

      toast.success("Trade actualizado exitosamente");
      onSave();
      onClose();
    } catch (error) {
      console.error("Error actualizando trade:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar el trade"
      );
    } finally {
      setLoading(false);
    }
  };

  // Manejo de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag and Drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // Ver imagen en modal
  const viewImage = async (attachment: MT5TradeAttachment) => {
    try {
      const imageData = await window.electronAPI.readMT5TradeAttachmentFile(
        attachment.filePath
      );
      if (imageData) {
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(
            `<img src="${imageData}" style="max-width: 100%; max-height: 100vh; object-fit: contain;" />`
          );
        }
      }
    } catch (error) {
      console.error("Error abriendo imagen:", error);
      toast.error("Error al abrir la imagen");
    }
  };

  const getOrderTypeBadge = (orderType: string) => {
    if (orderType === "BUY") {
      return (
        <Badge className='bg-emerald-50 text-emerald-700 border-emerald-200'>
          Buy
        </Badge>
      );
    }
    return (
      <Badge className='bg-orange-50 text-orange-700 border-orange-200'>
        Sell
      </Badge>
    );
  };

  const getProfitBadge = (profit: number) => {
    if (profit > 0) {
      return (
        <Badge className='bg-green-50 text-green-700 border-green-200'>
          +${profit.toFixed(2)}
        </Badge>
      );
    } else if (profit < 0) {
      return (
        <Badge className='bg-red-50 text-red-700 border-red-200'>
          ${profit.toFixed(2)}
        </Badge>
      );
    } else {
      return <Badge variant='outline'>$0.00</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <span>Editar Trade MT5</span>
            <Badge variant='outline' className='font-mono text-xs'>
              #{trade.position_id?.toString()}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Información inmutable del trade */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg'>
            <div>
              <Label className='text-xs text-gray-500 uppercase tracking-wide'>
                Símbolo
              </Label>
              <div className='flex items-center gap-2 mt-1'>
                <Badge variant='outline' className='font-mono'>
                  {trade.symbol}
                </Badge>
              </div>
            </div>
            <div>
              <Label className='text-xs text-gray-500 uppercase tracking-wide'>
                Tipo
              </Label>
              <div className='mt-1'>{getOrderTypeBadge(trade.trade_type)}</div>
            </div>
            <div>
              <Label className='text-xs text-gray-500 uppercase tracking-wide'>
                Volumen
              </Label>
              <p className='font-medium mt-1'>{trade.volume}</p>
            </div>
            <div>
              <Label className='text-xs text-gray-500 uppercase tracking-wide'>
                Apertura
              </Label>
              <p className='text-sm text-gray-600 mt-1'>
                {formatTradeDate(trade.open_time)}
              </p>
              <p className='font-mono text-sm'>{trade.open_price.toFixed(5)}</p>
            </div>
            <div>
              <Label className='text-xs text-gray-500 uppercase tracking-wide'>
                Cierre
              </Label>
              <p className='text-sm text-gray-600 mt-1'>
                {trade.close_time
                  ? formatTradeDate(trade.close_time)
                  : "Abierto"}
              </p>
              <p className='font-mono text-sm'>
                {trade.close_price ? trade.close_price.toFixed(5) : "-"}
              </p>
            </div>
            <div>
              <Label className='text-xs text-gray-500 uppercase tracking-wide'>
                P&L
              </Label>
              <div className='mt-1'>{getProfitBadge(trade.profit)}</div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {/* Estrategia */}
            <div>
              <Label htmlFor='strategy'>Estrategia Utilizada</Label>
              <Select
                value={formData.strategy_id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    strategy_id: value !== "none" ? parseInt(value) : undefined,
                  }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar estrategia (opcional)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Sin estrategia</SelectItem>
                  {strategies.map((strategy) => (
                    <SelectItem
                      key={strategy.id}
                      value={strategy.id!.toString()}>
                      {strategy.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Plan de Trading */}
            <div>
              <Label htmlFor='plan'>Plan de Trading</Label>
              <Select
                value={formData.plan_id?.toString() || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    plan_id: value !== "none" ? parseInt(value) : undefined,
                  }))
                }>
                <SelectTrigger>
                  <SelectValue placeholder='Seleccionar plan de trading (opcional)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>Sin plan</SelectItem>
                  {tradingPlans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id!.toString()}>
                      <div className='flex flex-col'>
                        <span>{plan.nombre}</span>
                        {plan.tipo_trader && (
                          <span className='text-xs text-gray-500 truncate'>
                            {plan.tipo_trader}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.plan_id && (
                <p className='text-xs text-blue-600 mt-1'>
                  💡 Este trade se asociará con tu plan de trading para
                  seguimiento y análisis
                </p>
              )}
            </div>

            {/* Descripción */}
            <div>
              <Label htmlFor='description'>
                Descripción del Trade (¿Por qué entraste?)
              </Label>
              <Textarea
                id='description'
                placeholder='Describe el análisis y razones para entrar en este trade...'
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Notas */}
            <div>
              <Label htmlFor='notes'>
                Notas Post-Trade (Errores y lecciones aprendidas)
              </Label>
              <Textarea
                id='notes'
                placeholder='¿Qué salió bien? ¿Qué errores cometiste? ¿Qué aprendiste?...'
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                rows={3}
              />
            </div>

            {/* Archivos adjuntos existentes */}
            {attachments.length > 0 && (
              <div>
                <Label>Archivos Adjuntos Existentes</Label>
                <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mt-2'>
                  {attachments.map((attachment) => {
                    const isImage = attachment.fileType?.startsWith("image/");
                    return (
                      <div
                        key={attachment.id}
                        className='flex items-center justify-between p-2 border rounded'>
                        <div className='flex items-center gap-2'>
                          {isImage ? (
                            <ImageIcon className='w-4 h-4 text-blue-500' />
                          ) : (
                            <FileText className='w-4 h-4 text-gray-500' />
                          )}
                          <span className='text-sm truncate'>
                            Adjunto {attachment.id}
                          </span>
                        </div>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => viewImage(attachment)}>
                          <Eye className='w-4 h-4' />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subir nuevos archivos */}
            <div>
              <Label>Agregar Archivos Adjuntos</Label>
              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}>
                <Upload className='w-8 h-8 text-gray-400 mx-auto mb-2' />
                <p className='text-sm text-gray-600 mb-2'>
                  Arrastra archivos aquí o haz clic para seleccionar
                </p>
                <input
                  type='file'
                  multiple
                  accept='image/*,.pdf,.txt,.doc,.docx'
                  onChange={handleFileChange}
                  className='hidden'
                  id='file-upload'
                />
                <Button type='button' variant='outline' asChild>
                  <label htmlFor='file-upload' className='cursor-pointer'>
                    Seleccionar Archivos
                  </label>
                </Button>
              </div>

              {/* Lista de archivos seleccionados */}
              {files.length > 0 && (
                <div className='mt-4 space-y-2'>
                  <Label>Archivos seleccionados:</Label>
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between p-2 bg-gray-50 rounded'>
                      <span className='text-sm text-gray-700'>{file.name}</span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => handleRemoveFile(index)}>
                        <X className='w-4 h-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botones */}
            <div className='flex gap-2 justify-end pt-4 border-t'>
              <Button
                type='button'
                variant='outline'
                onClick={onClose}
                disabled={loading}>
                Cancelar
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MT5TradeEditForm;
