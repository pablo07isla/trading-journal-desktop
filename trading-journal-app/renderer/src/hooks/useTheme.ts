import { createContext, useContext } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  effectiveTheme: "dark" | "light";
};

const ThemeProviderContext = createContext<
  ThemeProviderContextType | undefined
>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

export { ThemeProviderContext, type Theme, type ThemeProviderContextType };
