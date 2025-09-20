import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type AccountViewMode = "manual" | "mt5";

interface AccountViewSelectorProps {
  mode: AccountViewMode;
  onModeChange: (mode: AccountViewMode) => void;
  manualCount?: number;
  mt5Count?: number;
  loading?: boolean;
}

const AccountViewSelector: React.FC<AccountViewSelectorProps> = ({
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
        Cuentas Manuales
        {manualCount > 0 && (
          <Badge
            variant='secondary'
            className='ml-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-1.5 py-0.5'>
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
        Cuentas MT5
        {mt5Count > 0 && (
          <Badge
            variant='secondary'
            className='ml-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs px-1.5 py-0.5'>
            {mt5Count}
          </Badge>
        )}
      </Button>
    </div>
  );
};

export default AccountViewSelector;
