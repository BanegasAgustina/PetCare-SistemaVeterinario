/**
 * ARCHIVO: FormNotice.tsx
 * UBICACIÓN: mobile/src/components/ui/FormNotice.tsx
 * FUNCIÓN: Aviso de formulario para mensajes de estado o error con semántica accesible.
 * RESPONSABILIDAD: Presentar validación y respuesta de solicitudes junto al formulario.
 * CONEXIONES: Importa: mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/store-banners.tsx, mobile/src/app/admin/store-orders.tsx, mobile/src/app/admin/store-settings.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx y 30 más
 * FUNCIONAMIENTO: No renderiza cuando message es null; el flag error ajusta rol accesible y colores del tema.
 * IMPORTANCIA: Evita mensajes silenciosos y mantiene una presentación compartida.
 */
/** Mensajes de formularios con anuncio accesible y colores del tema. */
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { useTheme } from '../../hooks/useTheme';
/** Muestra un aviso accesible de error o información y no renderiza nada si está vacío. */
export function FormNotice({ message, error = false }: { message: string | null; error?: boolean }) {
  const { colors } = useTheme();
  if (!message) return null;
  return <View style={[styles.container, { backgroundColor: colors.surface, borderColor: error ? colors.danger : colors.border }]} accessibilityLiveRegion="polite"><Ionicons name={error?'alert-circle-outline':'information-circle-outline'} size={20} color={error?colors.danger:colors.primary} accessible={false}/><AppText accessibilityRole={error ? 'alert' : undefined} style={[styles.message,{color: error ? colors.danger : colors.text}]}>{message}</AppText></View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ container: { padding: 13, borderWidth: 1, borderRadius: 16, width: '100%', flexDirection:'row',alignItems:'flex-start',gap:9 },message:{flex:1,minWidth:0} });
