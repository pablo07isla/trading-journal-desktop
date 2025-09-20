import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type TradeViewMode = "manual" | "mt5";

interface TradeViewSelectorProps {
  mode: TradeViewMode;
  onModeChange: (mode: TradeViewMode) => void;
  manualCount?: number;
  mt5Count?: number;
  loading?: boolean;
}

const TradeViewSelector: React.FC<TradeViewSelectorProps> = ({
  mode,
  onModeChange,
  manualCount = 0,
  mt5Count = 0,
  loading = false,
}) => {
  return (
    <div className='flex items-center gap-2 p-1 bg-muted rounded-lg'>
      <Button
        variant={mode === "manual" ? "default" : "ghost"}
        size='sm'
        onClick={() => onModeChange("manual")}
        disabled={loading}
        className={`relative transition-all ${
          mode === "manual"
            ? "bg-background shadow-sm text-foreground border"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}>
        Trades Manuales
        {manualCount > 0 && (
          <Badge
            variant='secondary'
            className='ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 text-xs px-1.5 py-0.5'>
            {manualCount}
          </Badge>
        )}
      </Button>

      <Button
        variant={mode === "mt5" ? "default" : "ghost"}
        size='sm'
        onClick={() => onModeChange("mt5")}
        disabled={loading}
        className={`relative transition-all ${
          mode === "mt5"
            ? "bg-background shadow-sm text-foreground border"
            : "text-muted-foreground hover:text-foreground hover:bg-background/50"
        }`}>
        Trades MT5
        {mt5Count > 0 && (
          <Badge
            variant='secondary'
            className='ml-2 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-xs px-1.5 py-0.5'>
            {mt5Count}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default TradeViewSelector;
