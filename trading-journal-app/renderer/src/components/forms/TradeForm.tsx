import React, { useState, useEffect } from "react";
import type {
  TradeData,
  AttachmentFile,
  TradingAccountData,
  StrategyData,
} from "../../types/electron";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Target,
  FileText,
  Upload,
  Tag,
} from "lucide-react";

interface TradeFormProps {
  readonly onTradeAdded?: () => void;
  readonly onCancel?: () => void;
  initialTrade?: (TradeData & { id?: number }) | null;
  isEdit?: boolean;
  isReadOnly?: boolean;
}

const marketTypes = ["Forex", "Crypto", "Acciones", "Índices"];
const confidences = ["Alta", "Media", "Baja"];
const resultTypes = ["SL", "TP", "BE"];

const symbolOptions = [
  { value: "EURUSD", label: "EUR/USD (Euro vs US Dollar)" },
  { value: "GBPUSD", label: "GBP/USD (British Pound vs US Dollar)" },
  { value: "USDJPY", label: "USD/JPY (US Dollar vs Japanese Yen)" },
  { value: "USDCHF", label: "USD/CHF (US Dollar vs Swiss Franc)" },
  { value: "AUDUSD", label: "AUD/USD (Australian Dollar vs US Dollar)" },
  { value: "USDCAD", label: "USD/CAD (US Dollar vs Canadian Dollar)" },
  { value: "NZDUSD", label: "NZD/USD (New Zealand Dollar vs US Dollar)" },
  { value: "BTCUSD", label: "BTC/USD (Bitcoin)" },
  { value: "ETHUSD", label: "ETH/USD (Ethereum)" },
  { value: "XAUUSD", label: "XAU/USD (Gold)" },
  { value: "NAS100", label: "NASDAQ 100" },
  { value: "SPX500", label: "S&P 500" },
];

const TradeForm: React.FC<TradeFormProps> = ({
  onTradeAdded,
  onCancel,
  initialTrade,
  isEdit,
  isReadOnly = false,
}) => {
  const [trade, setTrade] = useState<Partial<TradeData>>(
    initialTrade ?? {
      symbol: "",
      orderType: "BUY",
      entryDate: new Date().toISOString().split("T")[0],
      status: "OPEN",
      commissions: undefined,
      strategyId: undefined,
      cuentaTradingId: undefined,
      marketType: undefined,
      confidence: undefined,
      description: "",
      notes: "",
      pnl: undefined,
      result: undefined,
    }
  );
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [symbolQuery, setSymbolQuery] = useState("");
  const [files, setFiles] = useState<(File | AttachmentFile)[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [tradingAccounts, setTradingAccounts] = useState<
    (TradingAccountData & { id: number })[]
  >([]);
  const [strategies, setStrategies] = useState<StrategyData[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );
  const [imageDialogOpen, setImageDialogOpen] = useState(false);

  useEffect(() => {
    if (initialTrade) {
      setTrade(initialTrade);
      // Cargar adjuntos si el trade tiene id
      if (initialTrade.id) {
        window.electronAPI
          .getAttachments(initialTrade.id)
          .then(
            (
              attachments: { id: number; filePath: string; fileType: string }[]
            ) => {
              // Convertir a objetos tipo AttachmentFile para previsualización
              const virtualFiles: AttachmentFile[] = attachments.map((att) => ({
                name: att.filePath.split(/[\\/]/).pop() || "adjunto",
                path: att.filePath,
                type: att.fileType,
                isAttachment: true,
              }));
              setFiles(virtualFiles);
            }
          );
      }
    } else {
      setTrade({
        symbol: "",
        orderType: "BUY",
        entryDate: new Date().toISOString().split("T")[0],
        status: "OPEN",
        commissions: undefined,
        strategyId: undefined,
        cuentaTradingId: undefined,
        marketType: undefined,
        confidence: undefined,
        description: "",
        notes: "",
        pnl: undefined,
        result: undefined,
      });
    }
  }, [initialTrade]);

  // Cargar cuentas de trading disponibles
  useEffect(() => {
    const loadTradingAccounts = async () => {
      try {
        const accounts = await window.electronAPI.getTradingAccounts();
        // Filtra solo las cuentas que tienen id definido
        setTradingAccounts(
          (accounts ?? []).filter(
            (a): a is TradingAccountData & { id: number } =>
              typeof a.id === "number"
          )
        );
      } catch (error) {
        console.error("Error loading trading accounts:", error);
      }
    };
    loadTradingAccounts();
  }, []); // Cargar estrategias disponibles
  useEffect(() => {
    const loadStrategies = async () => {
      try {
        const strategiesData = await window.electronAPI.getStrategies();
        setStrategies(strategiesData || []);
      } catch (error) {
        console.error("Error loading strategies:", error);
        toast.error("Error al cargar las estrategias");
      }
    };

    loadStrategies();
  }, []);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!trade.symbol || trade.symbol.trim() === "")
      newErrors.symbol = "El símbolo es obligatorio.";
    if (!trade.entryDate) newErrors.entryDate = "La fecha es obligatoria.";
    if (!trade.orderType)
      newErrors.orderType = "El tipo de orden es obligatorio.";
    if (typeof trade.pnl !== "number" || isNaN(trade.pnl))
      newErrors.pnl = "El campo P/L es obligatorio y debe ser un número.";
    if (!trade.result) newErrors.result = "El resultado es obligatorio.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      toast.error("Por favor corrige los errores en el formulario.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading(
      isEdit ? "Actualizando trade..." : "Guardando trade..."
    );
    try {
      let newTradeId: number | undefined = undefined;
      if (isEdit && initialTrade && typeof initialTrade.id === "number") {
        await window.electronAPI.updateTrade({
          ...initialTrade,
          ...trade,
          id: initialTrade.id,
        });
        newTradeId = initialTrade.id;
        toast.success("¡Trade actualizado correctamente!", { id: toastId });
      } else {
        // Guardar el trade y obtener el id insertado
        const result = await window.electronAPI.createTrade(trade as TradeData);
        // better-sqlite3 run() devuelve { lastInsertRowid }
        newTradeId =
          result && result.lastInsertRowid ? result.lastInsertRowid : undefined;
        toast.success("¡Trade guardado correctamente!", { id: toastId });
      }
      // Guardar archivos adjuntos si hay archivos y tradeId válido
      if (newTradeId && files.length > 0) {
        for (const file of files) {
          if ("isAttachment" in file) continue; // No volver a guardar adjuntos existentes
          const arrayBuffer = await (file as File).arrayBuffer();
          await window.electronAPI.saveAttachment(newTradeId, {
            buffer: arrayBuffer,
            originalName: file.name,
            mimeType: file.type,
          });
        }
      }
      setFiles([]);
      setTrade({
        symbol: "",
        orderType: "BUY",
        entryDate: new Date().toISOString().split("T")[0],
        status: "OPEN",
        commissions: undefined,
        strategyId: undefined,
        marketType: undefined,
        confidence: undefined,
        description: "",
        notes: "",
        pnl: undefined,
        result: undefined,
      });
      setErrors({});
      onTradeAdded?.();
    } catch {
      toast.error("Ocurrió un error al guardar el trade.", { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    field: keyof TradeData,
    value: string | number | undefined
  ) => {
    setTrade((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo al escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Maneja la selección de archivos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const selected = Array.from(e.target.files);
    // Limita a 3 archivos
    const newFiles = [
      ...files.filter((f) => !("isAttachment" in f)),
      ...selected,
    ].slice(0, 3);
    setFiles(newFiles);
  };

  // Elimina un archivo de la lista
  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Maneja archivos arrastrados y soltados
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const dropped = Array.from(e.dataTransfer.files);
      const newFiles = [
        ...files.filter((f) => !("isAttachment" in f)),
        ...dropped,
      ].slice(0, 3);
      setFiles(newFiles);
    }
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  // Utilidad para cachear data URLs de adjuntos ya leídos
  const attachmentDataUrlCache: Record<string, string> = {};

  // Hook para obtener los data URLs de todos los adjuntos existentes
  function useAttachmentDataUrls(files: (File | AttachmentFile)[]) {
    const [dataUrls, setDataUrls] = useState<(string | null)[]>(() =>
      files.map(() => null)
    );
    useEffect(() => {
      let isMounted = true;
      const fetchDataUrls = async () => {
        const results = await Promise.all(
          files.map(async (file) => {
            if (
              (file as AttachmentFile).isAttachment &&
              (file as AttachmentFile).path
            ) {
              const attFile = file as AttachmentFile;
              if (attachmentDataUrlCache[attFile.path]) {
                return attachmentDataUrlCache[attFile.path];
              } else {
                const url = await window.electronAPI.readAttachmentFile(
                  attFile.path
                );
                if (url) attachmentDataUrlCache[attFile.path] = url;
                return url || null;
              }
            }
            return null;
          })
        );
        if (isMounted) setDataUrls(results);
      };
      fetchDataUrls();
      return () => {
        isMounted = false;
      };
    }, [files]);
    return dataUrls;
  }

  const attachmentDataUrls = useAttachmentDataUrls(files);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setImageDialogOpen(true);
  };

  const getSelectedImageData = () => {
    if (selectedImageIndex === null) return null;
    const file = files[selectedImageIndex];
    const isAttachment =
      "isAttachment" in file && (file as AttachmentFile).isAttachment;

    if (isAttachment) {
      return {
        src: attachmentDataUrls[selectedImageIndex],
        name: file.name,
        isAttachment: true,
      };
    } else {
      return {
        src: URL.createObjectURL(file as File),
        name: file.name,
        isAttachment: false,
      };
    }
  };

  return (
    <div className='w-full max-w-7xl mx-auto px-2 sm:px-4 md:px-6 py-4 bg-white overflow-x-auto'>
      <div className='mb-6'>
        <h2 className='text-2xl font-bold text-gray-900 mb-2'>
          {isReadOnly ? "Ver Trade" : isEdit ? "Editar Trade" : "Nuevo Trade"}
        </h2>
        <p className='text-gray-600'>
          {isReadOnly
            ? "Detalles de la operación"
            : isEdit
            ? "Actualiza los datos de tu operación"
            : "Registra una nueva operación en tu diario"}
        </p>
      </div>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Layout horizontal: 3 columnas principales, responsivo */}
        <div className='grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'>
          {/* Columna 1: Información Básica */}
          <div className='bg-gray-50 rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <Tag className='w-5 h-5 text-gray-600' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Información Básica
              </h3>
            </div>
            <div className='space-y-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'>
                  <Target className='w-4 h-4' />
                  Símbolo *
                </label>
                <Popover open={symbolOpen && !isReadOnly} onOpenChange={setSymbolOpen}>
                  <PopoverTrigger asChild>
                    <div className='relative'>
                      <Input
                        type='text'
                        required
                        value={
                          symbolOptions
                            .find((opt) => opt.value === trade.symbol)
                            ?.label.split(" (")[0] ||
                          trade.symbol ||
                          ""
                        }
                        onClick={() => {
                          if (!isReadOnly) {
                            setSymbolOpen(true);
                            setSymbolQuery("");
                          }
                        }}
                        readOnly
                        placeholder='Ej: EUR/USD, BTC/USD, XAU/USD'
                        autoComplete='off'
                        className={`${!isReadOnly ? 'cursor-pointer hover:bg-gray-50 focus:bg-white' : 'cursor-default bg-gray-100'}`}
                        disabled={isReadOnly}
                      />
                      <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                        <Target className='w-4 h-4 text-gray-400' />
                      </div>
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className='p-0 w-[350px]' align='start'>
                    <Command>
                      <CommandInput
                        placeholder='Buscar símbolo...'
                        value={symbolQuery}
                        onValueChange={(v) => setSymbolQuery(v)}
                        autoFocus
                      />
                      <CommandList>
                        <CommandEmpty>No se encontraron símbolos.</CommandEmpty>
                        {symbolQuery.length > 0 &&
                          symbolOptions
                            .filter(
                              (option) =>
                                option.value
                                  .toLowerCase()
                                  .includes(
                                    symbolQuery
                                      .split("/")
                                      .join("")
                                      .toLowerCase()
                                  ) ||
                                option.label
                                  .toLowerCase()
                                  .includes(symbolQuery.toLowerCase())
                            )
                            .map((option) => (
                              <CommandItem
                                key={option.value}
                                value={option.value}
                                onSelect={() => {
                                  handleChange("symbol", option.value);
                                  setSymbolOpen(false);
                                  setSymbolQuery("");
                                }}>
                                <Badge
                                  variant='outline'
                                  className='mr-2 font-mono text-xs'>
                                  {option.value}
                                </Badge>
                                {option.label.split(" (")[0]}
                              </CommandItem>
                            ))}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'>
                  <Calendar className='w-4 h-4' />
                  Fecha *
                </label>
                <Input
                  type='date'
                  required
                  value={trade.entryDate || ""}
                  onChange={(e) => !isReadOnly && handleChange("entryDate", e.target.value)}
                  className='focus:ring-2 focus:ring-blue-200'
                  disabled={isReadOnly}
                />
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'>
                  {trade.orderType === "BUY" ? (
                    <TrendingUp className='w-4 h-4 text-green-600' />
                  ) : (
                    <TrendingDown className='w-4 h-4 text-red-600' />
                  )}
                  Tipo de orden *
                </label>
                <Select
                  value={trade.orderType}
                  onValueChange={(v) =>
                    !isReadOnly && handleChange("orderType", v as "BUY" | "SELL")
                  }
                  disabled={isReadOnly}>
                  <SelectTrigger className='focus:ring-2 focus:ring-blue-200'>
                    <SelectValue placeholder='Selecciona tipo' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='BUY'>
                      <div className='flex items-center gap-2'>
                        <TrendingUp className='w-4 h-4 text-green-600' />
                        <span className='text-green-700 font-medium'>Buy</span>
                      </div>
                    </SelectItem>
                    <SelectItem value='SELL'>
                      <div className='flex items-center gap-2'>
                        <TrendingDown className='w-4 h-4 text-red-600' />
                        <span className='text-red-700 font-medium'>Sell</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'>
                  <DollarSign className='w-4 h-4' />
                  P/L *
                </label>
                <div className='relative'>
                  <Input
                    type='number'
                    step='0.01'
                    value={trade.pnl ?? ""}
                    onChange={(e) =>
                      !isReadOnly && handleChange(
                        "pnl",
                        e.target.value ? parseFloat(e.target.value) : undefined
                      )
                    }
                    placeholder='Ganancia/Pérdida'
                    className='focus:ring-2 focus:ring-blue-200'
                    disabled={isReadOnly}
                  />
                  {typeof trade.pnl === "number" && (
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                      {trade.pnl > 0 ? (
                        <Badge className='bg-green-100 text-green-800 text-xs'>
                          +${trade.pnl.toFixed(2)}
                        </Badge>
                      ) : trade.pnl < 0 ? (
                        <Badge
                          variant='destructive'
                          className='bg-red-100 text-red-800 text-xs'>
                          -${Math.abs(trade.pnl).toFixed(2)}
                        </Badge>
                      ) : (
                        <Badge variant='secondary' className='text-xs'>
                          $0.00
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Resultado *
                </label>
                <Select
                  value={trade.result ?? ""}
                  onValueChange={(v) =>
                    !isReadOnly && handleChange("result", v as "SL" | "TP" | "BE")
                  }
                  disabled={isReadOnly}>
                  <SelectTrigger className='focus:ring-2 focus:ring-blue-200'>
                    <SelectValue placeholder='Selecciona resultado' />
                  </SelectTrigger>
                  <SelectContent>
                    {resultTypes.map((r) => (
                      <SelectItem key={r} value={r}>
                        <div className='flex items-center gap-2'>
                          {r === "SL" && (
                            <Badge variant='destructive' className='text-xs'>
                              SL
                            </Badge>
                          )}
                          {r === "TP" && (
                            <Badge className='bg-green-100 text-green-800 text-xs'>
                              TP
                            </Badge>
                          )}
                          {r === "BE" && (
                            <Badge variant='secondary' className='text-xs'>
                              BE
                            </Badge>
                          )}
                          <span>
                            {r === "SL"
                              ? "Stop Loss"
                              : r === "TP"
                              ? "Take Profit"
                              : "Break Even"}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Comisiones
                </label>
                <Input
                  type='number'
                  min='0'
                  step='0.01'
                  value={trade.commissions ?? ""}
                  onChange={(e) =>
                    !isReadOnly && handleChange(
                      "commissions",
                      e.target.value ? parseFloat(e.target.value) : undefined
                    )
                  }
                  placeholder='Opcional'
                  className='focus:ring-2 focus:ring-blue-200'
                  disabled={isReadOnly}
                />
              </div>
            </div>
          </div>

          {/* Columna 2: Estrategia y Análisis */}
          <div className='bg-blue-50 rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <span className='inline-block w-5 h-5 text-blue-600'>
                {/* Icono de target o similar */}
              </span>
              <h3 className='text-lg font-semibold text-gray-900'>
                Estrategia y Análisis
              </h3>
            </div>
            <div className='space-y-6'>
              {/* Campo Cuenta de trading */}
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Cuenta de trading
                </label>
                <Select
                  value={trade.cuentaTradingId?.toString() ?? ""}
                  onValueChange={(v) =>
                    !isReadOnly && handleChange("cuentaTradingId", v ? parseInt(v) : undefined)
                  }
                  disabled={isReadOnly}>
                  <SelectTrigger className='focus:ring-2 focus:ring-blue-200 bg-white'>
                    <SelectValue placeholder='Selecciona cuenta' />
                  </SelectTrigger>
                  <SelectContent>
                    {tradingAccounts.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id.toString()}>
                        {account.nombre}{" "}
                        <span className='text-xs text-gray-500 ml-2'>
                          ({account.broker})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Estrategia
                </label>
                <Select
                  value={trade.strategyId?.toString() ?? ""}
                  onValueChange={(v) =>
                    !isReadOnly && handleChange("strategyId", v ? parseInt(v) : undefined)
                  }
                  disabled={isReadOnly}>
                  <SelectTrigger className='focus:ring-2 focus:ring-blue-200 bg-white'>
                    <SelectValue placeholder='Selecciona estrategia' />
                  </SelectTrigger>{" "}
                  <SelectContent>
                    {" "}
                    {strategies
                      .filter(
                        (s) =>
                          s.estado === "activa" &&
                          typeof s.id === "number" &&
                          s.id > 0
                      )
                      .map((strategy) => (
                        <SelectItem
                          key={strategy.id}
                          value={strategy.id!.toString()}>
                          <Badge variant='outline' className='mr-2'>
                            {strategy.nombre}
                          </Badge>
                          {strategy.nombre}
                          {strategy.descripcion && (
                            <span className='text-xs text-gray-500 ml-2'>
                              ({strategy.descripcion.substring(0, 30)}
                              {strategy.descripcion.length > 30 ? "..." : ""})
                            </span>
                          )}
                        </SelectItem>
                      ))}
                    {strategies.filter(
                      (s) =>
                        s.estado === "activa" &&
                        typeof s.id === "number" &&
                        s.id > 0
                    ).length === 0 && (
                      <div className='px-2 py-2 text-sm text-gray-500'>
                        No hay estrategias activas disponibles
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tipo de mercado
                </label>
                <Select
                  value={trade.marketType ?? ""}
                  onValueChange={(v) => !isReadOnly && handleChange("marketType", v)}
                  disabled={isReadOnly}>
                  <SelectTrigger className='focus:ring-2 focus:ring-blue-200 bg-white'>
                    <SelectValue placeholder='Selecciona mercado' />
                  </SelectTrigger>
                  <SelectContent>
                    {marketTypes.map((m) => (
                      <SelectItem key={m} value={m}>
                        <Badge
                          variant='outline'
                          className={`mr-2 ${
                            m === "Forex"
                              ? "border-green-200 text-green-700"
                              : m === "Crypto"
                              ? "border-orange-200 text-orange-700"
                              : m === "Acciones"
                              ? "border-blue-200 text-blue-700"
                              : "border-purple-200 text-purple-700"
                          }`}>
                          {m}
                        </Badge>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Confianza
                </label>
                <Select
                  value={trade.confidence ?? ""}
                  onValueChange={(v) => !isReadOnly && handleChange("confidence", v)}
                  disabled={isReadOnly}>
                  <SelectTrigger className='focus:ring-2 focus:ring-blue-200 bg-white'>
                    <SelectValue placeholder='Nivel de confianza' />
                  </SelectTrigger>
                  <SelectContent>
                    {confidences.map((c) => (
                      <SelectItem key={c} value={c}>
                        <Badge
                          className={`mr-2 text-xs ${
                            c === "Alta"
                              ? "bg-green-100 text-green-800"
                              : c === "Media"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800"
                          }`}>
                          {c}
                        </Badge>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Descripción del trade
                </label>
                <Textarea
                  value={trade.description || ""}
                  onChange={(e) => !isReadOnly && handleChange("description", e.target.value)}
                  placeholder='¿Por qué abriste este trade? ¿Qué veías en el mercado? Describe tu análisis y razonamiento...'
                  rows={6}
                  className='focus:ring-2 focus:ring-blue-200 bg-white resize-none'
                  spellCheck={true}
                  disabled={isReadOnly}
                />
                {errors.description && (
                  <div className='text-red-600 text-xs mt-1'>
                    {errors.description}
                  </div>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  Explica tu análisis técnico/fundamental y el setup que viste
                </p>
              </div>
            </div>
          </div>

          {/* Columna 3: Notas y Archivos */}
          <div className='bg-green-50 rounded-lg p-6'>
            <div className='flex items-center gap-2 mb-4'>
              <FileText className='w-5 h-5 text-green-600' />
              <h3 className='text-lg font-semibold text-gray-900'>
                Notas y Observaciones
              </h3>
            </div>
            <div className='space-y-6'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Notas post-trade
                </label>
                <Textarea
                  value={trade.notes || ""}
                  onChange={(e) => !isReadOnly && handleChange("notes", e.target.value)}
                  placeholder='¿Qué aprendiste? ¿Qué harías diferente? Comentarios técnicos...'
                  rows={6}
                  className='focus:ring-2 focus:ring-green-200 bg-white resize-none'
                  spellCheck={true}
                  disabled={isReadOnly}
                />
                {errors.notes && (
                  <div className='text-red-600 text-xs mt-1'>
                    {errors.notes}
                  </div>
                )}
                <p className='text-xs text-gray-500 mt-1'>
                  Reflexiones y lecciones aprendidas de esta operación
                </p>
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2'>
                  <Upload className='w-4 h-4' />
                  Archivos adjuntos
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-4 text-center transition ${
                    isReadOnly
                      ? "bg-gray-100 border-gray-200 cursor-default"
                      : dragActive
                      ? "border-blue-400 bg-blue-50 bg-white cursor-pointer"
                      : "border-gray-300 hover:border-blue-400 bg-white cursor-pointer"
                  }`}
                  onClick={() =>
                    !isReadOnly && document.getElementById("tradefileinput")?.click()
                  }
                  onDrop={!isReadOnly ? handleDrop : undefined}
                  onDragOver={!isReadOnly ? handleDragOver : undefined}
                  onDragLeave={!isReadOnly ? handleDragLeave : undefined}>
                  <Upload className='w-6 h-6 text-gray-400 mx-auto mb-2' />
                  {!isReadOnly ? (
                    <>
                      <p className='text-sm text-gray-500 mb-1'>
                        Arrastra o haz click para seleccionar archivos
                      </p>
                      <p className='text-xs text-gray-400'>
                        Imágenes (JPG, PNG) y videos (MP4) - Máximo 3 archivos
                      </p>
                    </>
                  ) : (
                    <p className='text-sm text-gray-500'>
                      Archivos adjuntos
                    </p>
                  )}
                  <input
                    id='tradefileinput'
                    type='file'
                    multiple
                    accept='.jpg,.jpeg,.png,.mp4'
                    className='hidden'
                    onChange={handleFileChange}
                  />
                  <div className='flex flex-wrap gap-3 justify-center mt-4'>
                    {files.map((file, idx) => {
                      const isAttachment =
                        "isAttachment" in file &&
                        (file as AttachmentFile).isAttachment;
                      const dataUrl = isAttachment
                        ? attachmentDataUrls[idx]
                        : null;
                      return (
                        <div
                          key={idx}
                          className='relative group w-20 h-20 flex items-center justify-center border rounded bg-gray-50 overflow-hidden'>
                          {isAttachment ? (
                            file.type && file.type.startsWith("image") ? (
                              dataUrl ? (
                                <img
                                  src={dataUrl}
                                  alt={file.name}
                                  className='object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity'
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleImageClick(idx);
                                  }}
                                  title='Click para ampliar imagen'
                                />
                              ) : (
                                <span className='text-xs text-gray-400'>
                                  Cargando...
                                </span>
                              )
                            ) : file.type === "video/mp4" ? (
                              <span className='text-blue-500'>
                                <Upload className='w-8 h-8 mx-auto' />
                                <span className='block text-xs truncate'>
                                  {file.name}
                                </span>
                              </span>
                            ) : (
                              <span className='block text-xs truncate'>
                                {file.name}
                              </span>
                            )
                          ) : file.type && file.type.startsWith("image") ? (
                            <img
                              src={URL.createObjectURL(file as File)}
                              alt={file.name}
                              className='object-cover w-full h-full cursor-pointer hover:opacity-80 transition-opacity'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleImageClick(idx);
                              }}
                              title='Click para ampliar imagen'
                            />
                          ) : file.type === "video/mp4" ? (
                            <span className='text-blue-500'>
                              <Upload className='w-8 h-8 mx-auto' />
                              <span className='block text-xs truncate'>
                                {file.name}
                              </span>
                            </span>
                          ) : null}
                          {!isReadOnly && (
                            <button
                              type='button'
                              className='absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-xs text-red-600 hover:bg-red-100'
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(idx);
                              }}
                              title='Eliminar archivo'>
                              ×
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                {files.length > 0 && (
                  <div className='text-xs text-gray-500 mt-2'>
                    {files.length} archivo(s) seleccionado(s)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción - Mantienen su posición original */}
        <div className='flex gap-3 justify-end pt-6 mt-6 border-t border-gray-200'>
          {onCancel && (
            <Button
              type='button'
              variant='ghost'
              onClick={onCancel}
              className='px-6 py-2 hover:bg-gray-100'>
              {isReadOnly ? "Cerrar" : "Cancelar"}
            </Button>
          )}
          {!isReadOnly && (
            <Button
              type='submit'
              disabled={
                loading ||
                Object.values(errors).some((e) => e) ||
                !trade.symbol ||
                !trade.entryDate ||
                !trade.orderType ||
                typeof trade.pnl !== "number" ||
                isNaN(trade.pnl) ||
                !trade.result
              }
              className='px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm disabled:opacity-50'>
              {loading ? (
                <div className='flex items-center gap-2'>
                  <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                  Guardando...
                </div>
              ) : isEdit ? (
                "Actualizar Trade"
              ) : (
                "Guardar Trade"
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Modal para ampliar imágenes */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className='max-w-4xl max-h-[90vh] p-2'>
          <DialogHeader className='px-4 pt-4'>
            <DialogTitle className='text-lg font-semibold text-gray-900'>
              {getSelectedImageData()?.name || "Imagen"}
            </DialogTitle>
          </DialogHeader>
          <div className='flex justify-center items-center p-4 max-h-[80vh] overflow-hidden'>
            {getSelectedImageData()?.src && (
              <img
                src={getSelectedImageData()!.src ?? undefined}
                alt={getSelectedImageData()?.name || "Imagen ampliada"}
                className='max-w-full max-h-full object-contain rounded-lg shadow-lg'
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradeForm;
