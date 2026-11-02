/**
 * ARCHIVO: useTheme.ts
 * UBICACIÓN: mobile/src/hooks/useTheme.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useTheme.
 * CONEXIONES: Importa: mobile/src/contexts/ThemeContext.tsx Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/client/(tabs)/_layout.tsx, mobile/src/app/client/(tabs)/store/[id].tsx y 61 más
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Acceso tipado al tema; detecta usos fuera del proveedor principal. */
import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

/** Lee ThemeContext y reporta uso incorrecto fuera de ThemeProvider. */
export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme debe usarse dentro de ThemeProvider.');
  return theme;
}
