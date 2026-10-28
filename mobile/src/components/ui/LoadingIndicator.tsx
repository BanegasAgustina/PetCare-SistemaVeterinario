// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

/** Indicador de carga reutilizado en la restauración de sesión. */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
// Función LoadingIndicator: obtiene o consulta información dentro de este módulo.
export function LoadingIndicator({ label = 'Cargando…' }: { label?: string }) {
  const { colors } = useTheme();
  return <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}><ActivityIndicator size="large" color={colors.primary} /><AppText muted>{label}</AppText></View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 } });
