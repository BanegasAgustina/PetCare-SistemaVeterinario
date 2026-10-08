/** Mensajes de formularios con anuncio accesible y colores del tema. */
import { StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
export function FormNotice({ message, error = false }: { message: string | null; error?: boolean }) {
  const { colors } = useTheme();
  if (!message) return null;
  return <View style={[styles.container, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]} accessibilityLiveRegion="polite"><AppText accessibilityRole={error ? 'alert' : undefined} style={{ color: error ? colors.danger : colors.text }}>{message}</AppText></View>;
}
const styles = StyleSheet.create({ container: { padding: 16, borderWidth: 1, borderRadius: 16, width: '100%' } });
