// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

/** Mensajes de formularios con anuncio accesible y colores del tema. */
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
// Función FormNotice: concentra la lógica dentro de este módulo.
export function FormNotice({ message, error = false }: { message: string | null; error?: boolean }) {
  const { colors } = useTheme();
  if (!message) return null;
  return <View style={[styles.container, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]} accessibilityLiveRegion="polite"><Ionicons name={error?'alert-circle-outline':'information-circle-outline'} size={20} color={error?colors.danger:colors.primary} accessible={false}/><AppText accessibilityRole={error ? 'alert' : undefined} style={[styles.message,{color: error ? colors.danger : colors.text}]}>{message}</AppText></View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ container: { padding: 13, borderWidth: 1, borderRadius: 16, width: '100%', flexDirection:'row',alignItems:'flex-start',gap:9 },message:{flex:1,minWidth:0} });
