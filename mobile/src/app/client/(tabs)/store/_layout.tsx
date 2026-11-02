/**
 * ARCHIVO: _layout.tsx
 * UBICACIÓN: mobile/src/app/client/(tabs)/store/_layout.tsx
 * FUNCIÓN: Navegación interna de la pestaña Tienda.
 * RESPONSABILIDAD: Monta un Stack temático para catálogo, detalle, carrito y checkout sin encabezado duplicado.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router aplica este layout a las rutas store; la sesión y el contexto de carrito viven en layouts superiores.
 * IMPORTANCIA: Mantiene navegación de compra dentro del área de tienda.
 */
/** Las pantallas de carrito y checkout siguen dentro de la pestaña Tienda. */
import { Stack } from 'expo-router';
import { useTheme } from '../../../../hooks/useTheme';

/** Aplica tema y declara el Stack interno de tienda sin mostrar otra cabecera. */
export default function StoreStack() {
  const { colors } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />;
}
