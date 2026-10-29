// Este archivo se encarga de lo siguiente: Componente reutilizable del área clínica; permite al personal gestionar agenda, pacientes y atención.

/** Inicio profesional compartido. El servidor entrega agenda y métricas dentro del alcance efectivo del usuario. */
import { Pressable, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useTheme } from '../../hooks/useTheme';
import { PetCareScreen, PetCareHero, PetCareCard, PetCareEmptyState, PetImage, QueryState, ResponsiveGrid, statusLabel, type IconName } from '../client/PetCareUI';
import { RoleQuickAccess } from '../layout/RoleQuickAccess';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { clinicDateTime } from '../../utils/clinic-date';
import { appointmentDisplayValue, appointmentRouteId } from '../../utils/appointment-display';

export function StaffHome() {
  const { user } = useAuth();
  const clinic = useClinic();
  const query = useClientQuery(clinic.home);
  const upcoming = query.data?.upcomingAppointments ?? [];
  const isVeterinarian = user?.role === 'VETERINARIAN';
  const roleBase = isVeterinarian ? '/vet' : '/professional';
  const professionalName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const specialty = user?.veterinarian?.specialties.map(item => item.name).filter(Boolean).join(' · ');
  const subtitle = specialty || user?.professional?.name || user?.roleName;

  return <PetCareScreen wide>
    <PetCareHero eyebrow="PETCARE · PANEL PROFESIONAL" title={professionalName ? `Hola, ${user?.firstName}` : 'Tu jornada'} subtitle={subtitle} icon={isVeterinarian ? 'medical-outline' : 'cut-outline'} />

    <QueryState {...query} />
    {query.data && <StaffMetricCards items={[
      { label: 'Turnos de hoy', value: query.data.todayCount, icon: 'calendar-outline' },
      { label: 'Pendientes', value: query.data.pendingCount, icon: 'time-outline' },
      { label: 'En atención', value: query.data.attentionCount, icon: 'medkit-outline' },
      { label: 'Finalizados hoy', value: query.data.completedTodayCount, icon: 'checkmark-circle-outline' },
    ]} />}

    <View style={{ gap: 10 }}>
      <AppText variant="subtitle">Próximo turno</AppText>
      {upcoming[0] ? <AppointmentCard item={upcoming[0]} roleBase={roleBase} featured /> : query.data && <PetCareEmptyState title="No hay próximos turnos" message="Los próximos turnos asignados aparecerán acá." icon="calendar-outline" />}
    </View>

    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <AppText variant="subtitle">Próximos turnos</AppText>
        {upcoming.length > 0 && <AppText variant="caption" muted>{upcoming.length} en agenda</AppText>}
      </View>
      {upcoming.length ? <ResponsiveGrid minItemWidth={280} maxColumns={3}>{upcoming.slice(0, 5).map(item => <AppointmentCard key={String(item.id)} item={item} roleBase={roleBase} />)}</ResponsiveGrid> : query.data && <PetCareEmptyState title="Tu agenda está al día" message="No hay más turnos próximos asignados." icon="calendar-outline" />}
      {upcoming.length > 0 && <AppButton compact variant="secondary" label="Abrir agenda" onPress={() => router.push(`${roleBase}/agenda` as never)} />}
    </View>
    <RoleQuickAccess />
  </PetCareScreen>;
}

function AppointmentCard({ item, roleBase, featured = false }: { item: Record<string, unknown>; roleBase: string; featured?: boolean }) {
  const id = appointmentRouteId(item.id);
  const title = appointmentDisplayValue(item.petName, 'Mascota sin nombre');
  const status = appointmentDisplayValue(item.status ? statusLabel(String(item.status)) : null, 'Estado no disponible');
  return <Pressable accessibilityRole="button" accessibilityLabel={`Abrir turno de ${title}`} disabled={!id} onPress={() => id && router.push({ pathname: `${roleBase}/appointment` as never, params: { id } })}>
    <PetCareCard><View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <PetImage uri={typeof item.petPhotoUrl === 'string' ? item.petPhotoUrl : null} size={featured ? 54 : 44} />
      <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
        <AppText variant={featured ? 'subtitle' : 'body'} numberOfLines={1}>{title}</AppText>
        <AppText variant="caption" muted numberOfLines={2}>{appointmentDisplayValue(item.service, 'Servicio no disponible')} · {item.startsAt ? clinicDateTime(String(item.startsAt)) : 'Fecha no disponible'}</AppText>
        <AppText variant="caption" style={{ fontWeight: '700' }}>{status}</AppText>
      </View>
      <Ionicons name="chevron-forward" size={19} color="#28795D" />
    </View></PetCareCard>
  </Pressable>;
}

function StaffMetricCards({ items }: { items: { label: string; value: number | null; icon: IconName }[] }) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const columns = width < 380 ? 2 : width < 720 ? 2 : 4;
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
    {items.map(item => <View key={item.label} style={{ flexGrow: 1, flexBasis: columns === 2 ? '40%' : 180, minWidth: 125, backgroundColor: colors.surface, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: colors.border, gap: 9 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><View style={{ width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent }}><Ionicons name={item.icon} size={16} color={colors.primary} /></View><AppText variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>{item.label}</AppText></View>
      <AppText variant="title">{item.value ?? '—'}</AppText>
    </View>)}
  </View>;
}
