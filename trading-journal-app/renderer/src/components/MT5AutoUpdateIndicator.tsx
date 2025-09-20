import React from "react";
import { Clock, Pause, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MT5AutoUpdateIndicatorProps {
  lastUpdateTime: Date | null;
  isUpdating: boolean;
  nextUpdateIn: number; // seconds
  isAutoUpdatePaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onManualUpdate: () => void;
}

const MT5AutoUpdateIndicator: React.FC<MT5AutoUpdateIndicatorProps> = ({
  lastUpdateTime,
  isUpdating,
  nextUpdateIn,
  isAutoUpdatePaused,
  onPause,
  onResume,
  onManualUpdate,
}) => {
  // Formatear tiempo hasta próxima actualización
  const formatTimeRemaining = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Formatear última actualización
  const formatLastUpdate = (date: Date | null): string => {
    if (!date) return "Nunca";
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return "Hace un momento";
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Hace ${diffHours}h ${diffMinutes % 60}m`;

    return date.toLocaleString();
  };

  return (
    <div className='flex items-center gap-3 text-sm text-muted-foreground'>
      {/* Estado de actualización */}
      {isUpdating ? (
        <div className='flex items-center gap-2'>
          <RefreshCw className='w-4 h-4 animate-spin text-blue-600 dark:text-blue-400' />
          <span className='text-blue-600 dark:text-blue-400 font-medium'>
            Actualizando...
          </span>
        </div>
      ) : (
        <div className='flex items-center gap-2'>
          <Clock className='w-4 h-4' />
          <span>
            Última:{" "}
            <span className='font-medium'>
              {formatLastUpdate(lastUpdateTime)}
            </span>
          </span>
        </div>
      )}

      {/* Próxima actualización o estado pausado */}
      {isAutoUpdatePaused ? (
        <Badge
          variant='secondary'
          className='bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800/30'>
          <Pause className='w-3 h-3 mr-1' />
          Pausado
        </Badge>
      ) : (
        !isUpdating && (
          <Badge
            variant='outline'
            className='bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30'>
            <Clock className='w-3 h-3 mr-1' />
            Próxima en {formatTimeRemaining(nextUpdateIn)}
          </Badge>
        )
      )}

      {/* Controles */}
      <div className='flex items-center gap-1'>
        {/* Botón pausar/reanudar */}
        {isAutoUpdatePaused ? (
          <Button
            variant='ghost'
            size='sm'
            onClick={onResume}
            className='h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400'
            title='Reanudar actualización automática'>
            <Play className='w-3 h-3' />
          </Button>
        ) : (
          <Button
            variant='ghost'
            size='sm'
            onClick={onPause}
            className='h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400'
            title='Pausar actualización automática'>
            <Pause className='w-3 h-3' />
          </Button>
        )}

        {/* Botón actualización manual */}
        <Button
          variant='ghost'
          size='sm'
          onClick={onManualUpdate}
          disabled={isUpdating}
          className='h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400'
          title='Actualizar ahora'>
          <RefreshCw
            className={`w-3 h-3 ${isUpdating ? "animate-spin" : ""}`}
          />
        </Button>
      </div>
      {/* Botón de actualizar datos MT5 */}
      <Button
        onClick={onManualUpdate}
        disabled={isUpdating}
        className='ml-auto bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white shadow-sm flex items-center gap-2'>
        <RefreshCw className={`w-4 h-4 ${isUpdating ? "animate-spin" : ""}`} />
        {isUpdating ? "Actualizando..." : "Actualizar MT5"}
      </Button>
    </div>
  );
};

export default MT5AutoUpdateIndicator;
