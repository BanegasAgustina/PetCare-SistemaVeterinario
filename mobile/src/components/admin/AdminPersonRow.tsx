/**
 * ARCHIVO: AdminPersonRow.tsx
 * UBICACIÓN: mobile/src/components/admin/AdminPersonRow.tsx
 * FUNCIÓN: Fila/tarjeta compacta para persona administrativa o veterinaria.
 * RESPONSABILIDAD: Mostrar identidad, rol, estado y acciones de editar/ver en listados.
 * CONEXIONES: Importa: mobile/src/components/client/PetCareUI.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/hooks/useTheme.ts, mobile/src/constants/surface.ts Se utiliza desde: mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx
 * FUNCIONAMIENTO: Recibe imagen, nombre, rol y estado; botones delegan las acciones al consumidor.
 * IMPORTANCIA: Mantiene lectura y acciones consistentes en listados de personas.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PetImage } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { useTheme } from '../../hooks/useTheme';
import { softSurfaceShadow } from '../../constants/surface';

// Tipo AdminPersonRowProps: define la forma o las opciones válidas de los datos usados por este módulo.
type AdminPersonRowProps = {
  imageUri: string | null;
  name: string;
  role: string;
  status?: string;
  onEdit?: () => void;
  onView: () => void;
};

/** Presenta identidad/estado y delega acciones de edición o detalle. */
export function AdminPersonRow({ imageUri, name, role, status, onEdit, onView }: AdminPersonRowProps) {
  const { colors } = useTheme();
  return <View style={[styles.row, softSurfaceShadow(colors.primary), { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <PetImage uri={imageUri} size={48} />
    <View style={styles.identity}>
      <AppText variant="subtitle" numberOfLines={1}>{name}</AppText>
      <AppText muted numberOfLines={1}>{status ? `${role} · ${status}` : role}</AppText>
    </View>
    {onEdit && <Pressable accessibilityRole="button" accessibilityLabel={`Editar ${name}`} onPress={onEdit} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}>
      <Ionicons name="pencil-outline" size={20} color={colors.primary} accessible={false} />
    </Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel={`Ver detalle de ${name}`} onPress={onView} style={({ pressed }) => [styles.iconButton, { backgroundColor: colors.accent, opacity: pressed ? 0.7 : 1 }]}>
      <Ionicons name="eye-outline" size={21} color={colors.primary} accessible={false} />
    </Pressable>
  </View>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({
  row: { minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 20 },
  identity: { flex: 1, minWidth: 0, gap: 2 },
  iconButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
