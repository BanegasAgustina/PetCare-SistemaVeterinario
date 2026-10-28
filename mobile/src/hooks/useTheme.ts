// Este archivo se encarga de lo siguiente: Hook reutilizable de React; concentra estado o comportamiento que pueden compartir varias pantallas.

/** Acceso tipado al tema; detecta usos fuera del proveedor principal. */
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

// Función useTheme: concentra la lógica dentro de este módulo.
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme debe usarse dentro de ThemeProvider.');
  return theme;
}
