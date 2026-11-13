/**
 * ARCHIVO: LoadingIndicator.tsx
 * UBICACIÓN: mobile/src/components/ui/LoadingIndicator.tsx
 * FUNCIÓN: Indicador visual centrado con etiqueta accesible de carga.
 * RESPONSABILIDAD: Comunicar esperas mientras la app restaura sesión o carga una vista.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/components/client/PetCareUI.tsx
 * FUNCIONAMIENTO: Recibe una etiqueta opcional, anuncia el estado de progreso y combina indicador nativo con texto del sistema visual.
 * IMPORTANCIA: Permite distinguir una espera real de una pantalla vacía.
 */
/** Indicador de carga reutilizado en la restauración de sesión. */
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
/** Muestra un indicador accesible de progreso con el texto proporcionado. */
export function LoadingIndicator({ label = 'Cargando…' }: { label?: string }) {
  const { colors } = useTheme();
  return <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={label}><ActivityIndicator size="large" color={colors.primary} /><AppText muted>{label}</AppText></View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 } });
