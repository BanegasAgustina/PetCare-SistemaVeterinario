// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

/** Botón accesible con tamaño táctil mínimo y estados de interacción. */
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';

// Tipo AppButtonProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & { label: string; loading?: boolean; variant?: 'primary' | 'secondary' | 'accent'; compact?: boolean; centered?: boolean; destructive?: boolean };
// Función AppButton: concentra la lógica dentro de este módulo.
export function AppButton({ label, disabled, loading = false, variant = 'primary', compact = false, centered = false, destructive = false, ...props }: AppButtonProps) {
  const { colors } = useTheme();
  const inactive = Boolean(disabled || loading);
  const foreground = destructive ? colors.background : variant === 'accent' ? colors.onHighlight : variant === 'primary' ? colors.onPrimary : colors.primary;
  return (
    <Pressable {...props} disabled={inactive} accessibilityRole="button" accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.button, compact && styles.compact, compact && centered && styles.compactCentered, variant !== 'secondary' && !destructive && softSurfaceShadow(colors.primary), { backgroundColor: destructive ? colors.danger : variant === 'accent' ? colors.highlight : variant === 'primary' ? colors.primary : colors.surface, borderColor: destructive ? colors.danger : variant === 'accent' ? colors.highlight : colors.primary, opacity: inactive ? 0.65 : pressed ? 0.88 : 1, transform: [{ scale: pressed && !inactive ? 0.985 : 1 }] }] }>
      {loading && <ActivityIndicator color={foreground} />}<Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  button: { minHeight: 50, width: '100%', paddingVertical: 13, paddingHorizontal: 18, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: 42, minWidth: 88, width: 'auto', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  compactCentered: { alignSelf: 'center' },
  label: { flexShrink: 1, fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
