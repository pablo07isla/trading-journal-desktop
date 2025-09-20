import React from "react";
import { Settings, Clock, Zap, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

interface MT5AutoUpdateSettingsProps {
  intervalMinutes: number;
  isAutoUpdateEnabled: boolean;
  isAutoUpdatePaused: boolean;
  onIntervalChange: (minutes: number) => void;
  onToggleAutoUpdate: (enabled: boolean) => void;
}

const MT5AutoUpdateSettings: React.FC<MT5AutoUpdateSettingsProps> = ({
  intervalMinutes,
  isAutoUpdateEnabled,
  isAutoUpdatePaused,
  onIntervalChange,
  onToggleAutoUpdate,
}) => {
  const intervalOptions = [
    { value: 5, label: "5 minutos" },
    { value: 10, label: "10 minutos" },
    { value: 15, label: "15 minutos" },
    { value: 30, label: "30 minutos" },
    { value: 60, label: "1 hora" },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='sm'
          className='h-8 w-8 p-0 hover:bg-muted'
          title='Configurar actualización automática'>
          <Settings className='w-3 h-3' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-80' align='end'>
        <div className='space-y-4'>
          <div>
            <h4 className='font-medium text-sm mb-2'>
              Actualización Automática MT5
            </h4>
            <div className='flex items-center gap-2'>
              <div className='flex items-center gap-2'>
                {isAutoUpdateEnabled ? (
                  <Badge
                    variant='default'
                    className='bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800/30'>
                    <Zap className='w-3 h-3 mr-1' />
                    Activa
                  </Badge>
                ) : (
                  <Badge
                    variant='secondary'
                    className='bg-muted text-foreground border-border dark:bg-muted dark:text-muted-foreground'>
                    <Pause className='w-3 h-3 mr-1' />
                    Inactiva
                  </Badge>
                )}
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onToggleAutoUpdate(!isAutoUpdateEnabled)}
                className='text-xs'>
                {isAutoUpdateEnabled ? "Desactivar" : "Activar"}
              </Button>
            </div>
          </div>

          {isAutoUpdateEnabled && (
            <div>
              <label className='text-sm font-medium mb-2 block'>
                <Clock className='w-3 h-3 inline mr-1' />
                Intervalo de actualización
              </label>
              <div className='grid grid-cols-2 gap-2'>
                {intervalOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={
                      intervalMinutes === option.value ? "default" : "outline"
                    }
                    size='sm'
                    onClick={() => onIntervalChange(option.value)}
                    className='text-xs'>
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className='pt-2 border-t'>
            <p className='text-xs text-muted-foreground'>
              {isAutoUpdatePaused
                ? "⏸️ Actualización pausada manualmente"
                : isAutoUpdateEnabled
                ? `🔄 Actualizando cada ${intervalMinutes} minutos`
                : "⏹️ Actualización automática desactivada"}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default MT5AutoUpdateSettings;
