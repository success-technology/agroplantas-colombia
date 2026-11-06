import React, { createContext, useContext, useEffect, useState } from 'react';

const THEME_KEY = 'agroplantas_theme';
const FONT_SCALE_KEY = 'agroplantas_font_scale';
export type FontScale = 'normal' | 'large';

interface ThemeContextValue {
  darkMode: boolean;
  toggleDarkMode: () => void;
  fontScale: FontScale;
  setFontScale: (scale: FontScale) => void;
}

// Contexto único para que ajustes y componentes compartan tema y escala.
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Lee preferencias iniciales y sincroniza cambios con DOM y localStorage. */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem(THEME_KEY) === 'dark');
  const [fontScale, setFontScale] = useState<FontScale>(() => localStorage.getItem(FONT_SCALE_KEY) === 'large' ? 'large' : 'normal');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem(THEME_KEY, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.dataset.fontScale = fontScale;
    localStorage.setItem(FONT_SCALE_KEY, fontScale);
  }, [fontScale]);

  // Cambia el modo usando estado funcional para evitar valores obsoletos.
  const toggleDarkMode = () => setDarkMode((current) => !current);

  return <ThemeContext.Provider value={{ darkMode, toggleDarkMode, fontScale, setFontScale }}>{children}</ThemeContext.Provider>;
};

/** Acceso tipado al contexto; falla temprano si falta el proveedor raíz. */
export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de ThemeProvider');
  return context;
};
