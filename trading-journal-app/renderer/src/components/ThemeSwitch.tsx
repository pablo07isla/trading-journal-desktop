import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Switch } from "@/components/ui/switch";

export function ThemeSwitch() {
  const { setTheme, effectiveTheme } = useTheme();

  const handleSwitchChange = (checked: boolean) => {
    if (checked) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  };

  // El switch está "checked" cuando el tema efectivo es dark
  const isChecked = effectiveTheme === "dark";

  return (
    <div className='flex items-center gap-2'>
      <Sun
        className={`h-4 w-4 transition-colors ${
          isChecked ? "text-muted-foreground" : "text-foreground"
        }`}
      />
      <Switch
        checked={isChecked}
        onCheckedChange={handleSwitchChange}
        aria-label='Cambiar tema'
      />
      <Moon
        className={`h-4 w-4 transition-colors ${
          isChecked ? "text-foreground" : "text-muted-foreground"
        }`}
      />
    </div>
  );
}
