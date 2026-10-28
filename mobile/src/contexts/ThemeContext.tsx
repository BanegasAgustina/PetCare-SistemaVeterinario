// Este archivo se encarga de lo siguiente: Contexto compartido de React; conserva estado y acciones que usan varias pantallas.

/** Comparte el tema del sistema y una preferencia temporal mediante Context API. */
import { createContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { themes } from '../constants/theme';

// Tipo ThemePreference: define la forma o las opciones válidas de los datos usados por este módulo.
type ThemePreference = 'system' | 'light' | 'dark';
// Tipo ThemeContextValue: define la forma o las opciones válidas de los datos usados por este módulo.
type ThemeContextValue = {
  colors: typeof themes.light;
  mode: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};
// Dato ThemeContext: conserva un valor calculado o de configuración usado por este módulo.
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

// Función ThemeProvider: concentra la lógica dentro de este módulo.
export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  // Memorizar mantiene estable el contexto cuando el tema no cambia.
  const value = useMemo(() => ({ colors: themes[mode], mode, preference, setPreference }), [mode, preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
