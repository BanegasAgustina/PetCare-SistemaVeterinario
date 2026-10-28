// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

/** Texto reutilizable con jerarquía visual y escalado accesible del sistema. */
import { StyleSheet, Text, type TextProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

// Tipo AppTextProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AppTextProps = TextProps & { variant?: 'title' | 'subtitle' | 'body' | 'caption'; muted?: boolean };
// Función AppText: concentra la lógica dentro de este módulo.
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
