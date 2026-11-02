/**
 * ARCHIVO: ThemeContext.tsx
 * UBICACIÓN: mobile/src/contexts/ThemeContext.tsx
 * FUNCIÓN: Proveedor de estado compartido.
 * RESPONSABILIDAD: Proveedor de estado compartido dentro de PetCare; agrupa las declaraciones de ThemeContext.
 * CONEXIONES: Importa: mobile/src/constants/theme.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/hooks/useTheme.ts
 * FUNCIONAMIENTO: Mantiene estado compartido y lo expone a los componentes descendientes mediante Context.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Comparte el tema del sistema y una preferencia temporal mediante Context API. */
import { createContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { themes } from '../constants/theme';

/** Elige seguimiento del sistema o una paleta forzada. */
type ThemePreference = 'system' | 'light' | 'dark';
/** Datos y acción que el provider comparte con sus consumidores. */
type ThemeContextValue = {
  colors: typeof themes.light;
  mode: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};
// Contexto privado del estado y colores del tema.
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

/** Selecciona tema claro/oscuro por preferencia o esquema del sistema y comparte colores mediante Context. */
export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  // Memorizar mantiene estable el contexto cuando el tema no cambia.
  const value = useMemo(() => ({ colors: themes[mode], mode, preference, setPreference }), [mode, preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
