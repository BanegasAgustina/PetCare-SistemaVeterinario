/**
 * ARCHIVO: AppText.tsx
 * UBICACIÓN: mobile/src/components/ui/AppText.tsx
 * FUNCIÓN: Texto con variantes tipográficas y color atenuado según el tema.
 * RESPONSABILIDAD: Compartir jerarquía y estilo de lectura en toda la interfaz.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/_layout.tsx, mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/index.tsx, mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/products.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx y 83 más
 * FUNCIONAMIENTO: Extiende TextProps; la variante selecciona estilos y el tema resuelve colores sin cambiar el texto recibido.
 * IMPORTANCIA: Evita estilos tipográficos inconsistentes entre pantallas.
 */
/** Texto reutilizable con jerarquía visual y escalado accesible del sistema. */
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// Tipo AppTextProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AppTextProps = TextProps & { variant?: 'title' | 'subtitle' | 'body' | 'caption'; muted?: boolean };
/** Aplica la tipografía PetCare y el color de texto del tema al componente Text. */
export function AppText({ variant = 'body', muted = false, style, ...props }: AppTextProps) {
  const { colors } = useTheme();
  return <Text {...props} style={[styles[variant], { color: muted ? colors.muted : colors.text }, style]} />;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  title: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -0.45 },
  subtitle: { fontSize: 20, lineHeight: 27, fontWeight: '600', letterSpacing: -0.15 },
  body: { fontSize: 16, lineHeight: 24 },
  caption: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
});
