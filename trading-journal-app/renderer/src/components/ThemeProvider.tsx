import { useEffect, useState } from "react";
import { ThemeProviderContext, type Theme } from "@/hooks/useTheme";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "trading-journal-ui-theme",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // Intentar obtener el tema guardado de localStorage
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem(storageKey) as Theme | null;
      return storedTheme || defaultTheme;
    }
    return defaultTheme;
  });

  const [effectiveTheme, setEffectiveTheme] = useState<"dark" | "light">(
    "light"
  );

  // Función para detectar si el sistema prefiere dark mode
  const getSystemTheme = (): "dark" | "light" => {
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  // Actualizar el tema efectivo basado en la selección
  useEffect(() => {
    const newEffectiveTheme = theme === "system" ? getSystemTheme() : theme;
    setEffectiveTheme(newEffectiveTheme);
  }, [theme]);

  // Aplicar el tema al documento y guardar en localStorage
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(effectiveTheme);

    // Guardar en localStorage
    localStorage.setItem(storageKey, theme);
  }, [effectiveTheme, theme, storageKey]);

  // Escuchar cambios en las preferencias del sistema
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = (e: MediaQueryListEvent) => {
      setEffectiveTheme(e.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    effectiveTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}
