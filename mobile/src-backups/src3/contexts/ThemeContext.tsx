/** Comparte el tema del sistema y una preferencia temporal mediante Context API. */
import { createContext, useMemo, useState, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import { themes } from '../constants/theme';

type ThemePreference = 'system' | 'light' | 'dark';
type ThemeContextValue = {
  colors: typeof themes.light;
  mode: 'light' | 'dark';
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const mode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  // Memorizar mantiene estable el contexto cuando el tema no cambia.
  const value = useMemo(() => ({ colors: themes[mode], mode, preference, setPreference }), [mode, preference]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
