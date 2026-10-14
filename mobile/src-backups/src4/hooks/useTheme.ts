/** Acceso tipado al tema; detecta usos fuera del proveedor principal. */
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme debe usarse dentro de ThemeProvider.');
  return theme;
}
