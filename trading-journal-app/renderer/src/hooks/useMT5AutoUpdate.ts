import { useEffect, useRef, useCallback, useState } from "react";

interface MT5AutoUpdateOptions {
  intervalMinutes?: number; // Intervalo en minutos (default: 10)
  enableAutoUpdate?: boolean; // Habilitar actualización automática
  onUpdate?: () => Promise<void>; // Función de actualización
  onUpdateStart?: () => void; // Callback cuando inicia la actualización
  onUpdateEnd?: () => void; // Callback cuando termina la actualización
  onError?: (error: string) => void; // Callback para errores
}

interface MT5AutoUpdateReturn {
  lastUpdateTime: Date | null;
  isUpdating: boolean;
  nextUpdateIn: number; // Segundos hasta la próxima actualización
  manualUpdate: () => Promise<void>;
  pauseAutoUpdate: () => void;
  resumeAutoUpdate: () => void;
  isAutoUpdatePaused: boolean;
}

export const useMT5AutoUpdate = ({
  intervalMinutes = 10,
  enableAutoUpdate = true,
  onUpdate,
  onUpdateStart,
  onUpdateEnd,
  onError,
}: MT5AutoUpdateOptions): MT5AutoUpdateReturn => {
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [nextUpdateIn, setNextUpdateIn] = useState(intervalMinutes * 60);
  const [isAutoUpdatePaused, setIsAutoUpdatePaused] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialUpdateDone = useRef(false);

  // Función para ejecutar la actualización
  const executeUpdate = useCallback(async () => {
    if (!onUpdate || isUpdating) return;

    try {
      setIsUpdating(true);
      onUpdateStart?.();

      await onUpdate();

      setLastUpdateTime(new Date());
      setNextUpdateIn(intervalMinutes * 60); // Reiniciar countdown
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      onError?.(errorMessage);
      console.error("Error en actualización automática MT5:", error);
    } finally {
      setIsUpdating(false);
      onUpdateEnd?.();
    }
  }, [
    onUpdate,
    isUpdating,
    intervalMinutes,
    onUpdateStart,
    onUpdateEnd,
    onError,
  ]);

  // Actualización manual
  const manualUpdate = useCallback(async () => {
    await executeUpdate();
  }, [executeUpdate]);

  // Pausar actualización automática
  const pauseAutoUpdate = useCallback(() => {
    setIsAutoUpdatePaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  // Reanudar actualización automática
  const resumeAutoUpdate = useCallback(() => {
    setIsAutoUpdatePaused(false);
    setNextUpdateIn(intervalMinutes * 60);
  }, [intervalMinutes]);

  // Countdown timer
  useEffect(() => {
    if (!enableAutoUpdate || isAutoUpdatePaused || isUpdating) return;

    countdownRef.current = setInterval(() => {
      setNextUpdateIn((prev) => {
        if (prev <= 1) {
          return intervalMinutes * 60; // Reiniciar countdown
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, [enableAutoUpdate, isAutoUpdatePaused, isUpdating, intervalMinutes]);

  // Timer principal para actualización
  useEffect(() => {
    if (!enableAutoUpdate || isAutoUpdatePaused) return;

    // Actualización inicial cuando se monta el componente
    if (!isInitialUpdateDone.current) {
      executeUpdate();
      isInitialUpdateDone.current = true;
    }

    // Configurar timer para actualizaciones periódicas
    intervalRef.current = setInterval(() => {
      if (!isUpdating && !isAutoUpdatePaused) {
        executeUpdate();
      }
    }, intervalMinutes * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [
    enableAutoUpdate,
    isAutoUpdatePaused,
    intervalMinutes,
    executeUpdate,
    isUpdating,
  ]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Pausar cuando la ventana pierde el foco (opcional)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // La ventana perdió el foco, pausar temporalmente
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      } else {
        // La ventana recuperó el foco, reanudar countdown
        if (enableAutoUpdate && !isAutoUpdatePaused && !isUpdating) {
          countdownRef.current = setInterval(() => {
            setNextUpdateIn((prev) => {
              if (prev <= 1) {
                return intervalMinutes * 60;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [enableAutoUpdate, isAutoUpdatePaused, isUpdating, intervalMinutes]);

  return {
    lastUpdateTime,
    isUpdating,
    nextUpdateIn,
    manualUpdate,
    pauseAutoUpdate,
    resumeAutoUpdate,
    isAutoUpdatePaused,
  };
};
