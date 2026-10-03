/** Indicador de carga reutilizado en la restauración de sesión. */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
export function LoadingIndicator({ label = 'Cargando…' }: { label?: string }) {
  const { colors } = useTheme();
  return <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}><ActivityIndicator size="large" color={colors.primary} /><AppText muted>{label}</AppText></View>;
}
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 } });
