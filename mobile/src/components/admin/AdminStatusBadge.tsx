/**
 * ARCHIVO: AdminStatusBadge.tsx
 * UBICACIÓN: mobile/src/components/admin/AdminStatusBadge.tsx
 * FUNCIÓN: Etiqueta visual de estado traducida al vocabulario de PetCare.
 * RESPONSABILIDAD: Presentar estados de turnos, pacientes y entidades clínicas en listados.
 * CONEXIONES: Importa: mobile/src/hooks/useTheme.ts, mobile/src/components/ui/AppText.tsx, mobile/src/utils/display-labels.ts Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx
 * FUNCIONAMIENTO: Usa display-labels para resolver texto y tema para elegir estilos de estado.
 * IMPORTANCIA: Evita traducciones y colores divergentes por cada pantalla.
 */
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { AppText } from '../ui/AppText';
import { generalStatusLabel } from '../../utils/display-labels';

/** Traduce el estado y selecciona una apariencia semántica coherente. */
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
