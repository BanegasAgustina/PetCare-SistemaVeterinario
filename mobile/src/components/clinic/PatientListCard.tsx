import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PetCareCard, PetImage } from '../client/PetCareUI';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AdminStatusBadge } from '../admin/AdminStatusBadge';
import { useTheme } from '../../hooks/useTheme';
import { PatientLifecycleControl } from './PatientLifecycleControl';
import type { ClinicRow } from '../../types/clinic';
import { clinicDateTime } from '../../utils/clinic-date';
import { normalizePetActiveFlag, petStatusBadge } from '../../utils/pet-status';

function invitationStateLabel(value: unknown): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente de invitación', sent: 'Invitación enviada', failed: 'Invitación no enviada',
    expired: 'Invitación vencida', registered: 'Propietario registrado',
  };
  return labels[String(value)] ?? 'Estado no disponible';
}

type PatientListCardProps = {
  patient: ClinicRow;
  veterinarian: boolean;
  groomer: boolean;
  canEdit: boolean;
  canManageLifecycle: boolean;
  canResendInvitation: boolean;
  invitationLoading: boolean;
  onView: () => void;
  onEdit: () => void;
  onResendInvitation: () => void;
  onChanged: () => void;
};

export function PatientListCard({
  patient, veterinarian, groomer, canEdit, canManageLifecycle,
  canResendInvitation, invitationLoading, onView, onEdit,
  onResendInvitation, onChanged,
}: PatientListCardProps) {
  const { colors } = useTheme();
  const isActive = normalizePetActiveFlag(patient.isActive);
  const ownerName = String(patient.ownerName ?? '').trim();
  const invitation = patient.ownerRegistrationState;
  const lastActivity = veterinarian ? patient.lastConsultationAt : groomer ? patient.lastServiceAt : null;
  const lastActivityLabel = veterinarian ? 'Última consulta' : 'Último servicio';

  return <PetCareCard style={styles.card}>
    <View style={styles.header}>
      <PetImage uri={typeof patient.photoUrl === 'string' ? patient.photoUrl : null} size={58} />
      <View style={styles.identity}>
        <AppText variant="subtitle" numberOfLines={1}>{String(patient.name)}</AppText>
        <AppText variant="caption" muted numberOfLines={1}>
          {String(patient.species)}{Boolean(patient.breed) ? ` · ${String(patient.breed)}` : ''}
        </AppText>
        <View style={styles.statusLine}>
          <AdminStatusBadge status={petStatusBadge(patient.isActive)} />
          {Boolean(invitation) && <AppText variant="caption" muted numberOfLines={1}>{invitationStateLabel(invitation)}</AppText>}
        </View>
      </View>
      <View style={styles.headerActions}>
        <IconAction label={`Ver información de ${String(patient.name)}`} icon="eye-outline" onPress={onView} colors={colors} />
        {canEdit && isActive === true && <IconAction label={`Editar ${String(patient.name)}`} icon="create-outline" onPress={onEdit} colors={colors} />}
      </View>
    </View>

    {(ownerName || lastActivity || patient.nextAppointmentAt || (isActive === false && patient.deactivationReason)) && <View style={[styles.details, { borderTopColor: colors.border }]}>
      {Boolean(ownerName) && <DetailLine icon="person-outline" label="Propietario" value={ownerName} />}
      {lastActivity && <DetailLine icon="time-outline" label={lastActivityLabel} value={clinicDateTime(String(lastActivity))} />}
      {patient.nextAppointmentAt && <DetailLine icon="calendar-outline" label="Próximo turno" value={clinicDateTime(String(patient.nextAppointmentAt))} />}
      {isActive === false && Boolean(patient.deactivationReason) && <DetailLine icon="information-circle-outline" label="Motivo" value={String(patient.deactivationReason)} />}
    </View>}

    {(canManageLifecycle || canResendInvitation) && <View style={styles.actions}>
      {canManageLifecycle && <PatientLifecycleControl
        patientId={String(patient.id)}
        isActive={isActive}
        canManage={canManageLifecycle}
        onComplete={onChanged}
      />}
      {canResendInvitation && <AppButton
        compact
        variant="secondary"
        label="Reenviar invitación"
        loading={invitationLoading}
        onPress={onResendInvitation}
      />}
    </View>}
  </PetCareCard>;
}

function IconAction({ label, icon, onPress, colors }: { label: string; icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; colors: ReturnType<typeof useTheme>['colors'] }) {
  return <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    onPress={onPress}
    style={[styles.iconAction, { backgroundColor: colors.accent, borderColor: colors.border }]}
  ><Ionicons name={icon} size={20} color={colors.primary} /></Pressable>;
}

function DetailLine({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  const { colors } = useTheme();
  return <View style={styles.detailLine}>
    <Ionicons name={icon} size={16} color={colors.muted} />
    <AppText variant="caption" muted numberOfLines={1} style={styles.detailLabel}>{label}</AppText>
    <AppText variant="caption" numberOfLines={2} style={styles.detailValue}>{value}</AppText>
  </View>;
}

const styles = StyleSheet.create({
  card: { padding: 15, gap: 13 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  identity: { flex: 1, minWidth: 0, gap: 3 },
  statusLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7, marginTop: 3 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconAction: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  details: { gap: 8, paddingTop: 11, borderTopWidth: StyleSheet.hairlineWidth },
  detailLine: { flexDirection: 'row', alignItems: 'center', gap: 7, minWidth: 0 },
  detailLabel: { flexShrink: 0 },
  detailValue: { flex: 1, minWidth: 0 },
  actions: { gap: 9, paddingTop: 2 },
});
