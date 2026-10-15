/** Botón accesible con tamaño táctil mínimo y estados de interacción. */
import { ActivityIndicator, Pressable, StyleSheet, Text, type PressableProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

type AppButtonProps = Omit<PressableProps, 'children' | 'style'> & { label: string; loading?: boolean; variant?: 'primary' | 'secondary'; compact?: boolean; centered?: boolean; destructive?: boolean };
export function AppButton({ label, disabled, loading = false, variant = 'primary', compact = false, centered = false, destructive = false, ...props }: AppButtonProps) {
  const { colors } = useTheme();
  const inactive = Boolean(disabled || loading);
  const foreground = destructive ? colors.background : variant === 'primary' ? colors.onPrimary : colors.primary;
  return (
    <Pressable {...props} disabled={inactive} accessibilityRole="button" accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [styles.button, compact && styles.compact, compact && centered && styles.compactCentered, { backgroundColor: destructive ? colors.danger : variant === 'primary' ? colors.primary : colors.surface, borderColor: destructive ? colors.danger : colors.primary, opacity: inactive ? 0.65 : pressed ? 0.8 : 1 }]}>
      {loading && <ActivityIndicator color={foreground} />}<Text style={[styles.label, { color: foreground }]}>{label}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: { minHeight: 52, width: '100%', paddingVertical: 14, paddingHorizontal: 20, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  compact: { minHeight: 42, minWidth: 88, width: 'auto', alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  compactCentered: { alignSelf: 'center' },
  label: { flexShrink: 1, fontSize: 16, fontWeight: '600', textAlign: 'center' },
});
