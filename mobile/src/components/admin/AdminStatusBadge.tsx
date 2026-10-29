// Este archivo se encarga de lo siguiente: Componente reutilizable del área administrativa; organiza formularios, listas o controles de gestión.

import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import { generalStatusLabel } from '../../utils/display-labels';

// Función AdminStatusBadge: concentra la lógica dentro de este módulo.
export function AdminStatusBadge({ status }: { status: string }) {
  const { colors } = useTheme();
  const tone = status === 'ACTIVE'
    ? { backgroundColor: colors.accent, color: colors.primary }
    : status === 'INACTIVE'
      ? { backgroundColor: colors.background, color: colors.muted }
      : status === 'UNKNOWN'
        ? { backgroundColor: colors.background, color: colors.muted }
      : status === 'REQUESTED'
    ? { backgroundColor: colors.highlight, color: colors.onHighlight }
    : status === 'IN_PROGRESS'
      ? { backgroundColor: colors.primary, color: colors.onPrimary }
      : status === 'CANCELLED' || status === 'REJECTED'
        ? { backgroundColor: colors.danger, color: colors.text }
        : status === 'COMPLETED'
          ? { backgroundColor: colors.background, color: colors.muted }
          : { backgroundColor: colors.accent, color: colors.primary };
  return <View style={[styles.badge, { backgroundColor: tone.backgroundColor }]}>
    <AppText variant="caption" style={{ color: tone.color, fontWeight: '700' }}>{generalStatusLabel(status)}</AppText>
  </View>;
}

// Dato styles: conserva un valor calculado o de configuración usado por este módulo.
const styles = StyleSheet.create({ badge: { minHeight: 26, alignSelf: 'flex-start', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 13 } });
