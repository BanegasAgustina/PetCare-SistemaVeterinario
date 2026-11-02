/**
 * ARCHIVO: CompactPagination.tsx
 * UBICACIÓN: mobile/src/components/ui/CompactPagination.tsx
 * FUNCIÓN: Controles compactos anterior/siguiente con resumen de página opcional.
 * RESPONSABILIDAD: Dar navegación accesible a listados paginados en admin y clínica.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx Se utiliza desde: mobile/src/app/admin/products.tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/ProfessionalsScreen.tsx
 * FUNCIONAMIENTO: Recibe capacidades de avanzar/retroceder y callbacks del dueño de los datos; deshabilita los controles cuando no hay página disponible.
 * IMPORTANCIA: Separa la presentación de paginación de la consulta que obtiene cada página.
 */
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from './AppText';

// Función CompactPagination: concentra la lógica dentro de este módulo.
export function CompactPagination({ page, canPrevious, canNext, onPrevious, onNext, summary }: { page: number; canPrevious: boolean; canNext: boolean; onPrevious: () => void; onNext: () => void; summary?: string }) {
  const { colors } = useTheme();
  if (page <= 1 && !canNext) return null;
  return <View style={styles.row}>
    {Boolean(summary) && <AppText muted style={styles.summary}>{summary}</AppText>}
    <View style={styles.controls}>
      <Pressable accessibilityRole="button" accessibilityLabel="Página anterior" disabled={!canPrevious} onPress={onPrevious} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, !canPrevious && styles.disabled]}><Ionicons name="chevron-back" size={19} color={canPrevious ? colors.text : colors.muted}/></Pressable>
      <AppText variant="caption" style={styles.page}>Página {page}</AppText>
      <Pressable accessibilityRole="button" accessibilityLabel="Página siguiente" disabled={!canNext} onPress={onNext} style={[styles.button, { backgroundColor: colors.surface, borderColor: colors.border }, !canNext && styles.disabled]}><Ionicons name="chevron-forward" size={19} color={canNext ? colors.text : colors.muted}/></Pressable>
    </View>
  </View>;
}
// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ row: { minHeight: 44, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 10 }, summary: { flex: 1, minWidth: 110 }, controls: { flexDirection: 'row', alignItems: 'center', gap: 8 }, button: { width: 44, height: 44, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.45 }, page: { minWidth: 62, textAlign: 'center' } });
