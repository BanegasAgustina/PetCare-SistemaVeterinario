import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAdminModules } from '../../components/layout/GlobalNavigation';
import { AppText } from '../../components/ui/AppText';
import { PetCareAction, PetCareCard, PetCareHeader, PetCareScreen, QueryState, ResponsiveGrid, type IconName } from '../../components/client/PetCareUI';
import { useTheme } from '../../hooks/useTheme';
import { clinicDateTime } from '../../utils/clinic-date';

type Metric = { label: string; value: number | null; icon: IconName };
type QuickLink = { path: string; title: string; icon: IconName };

export default function AdminHome() {
  const { user } = useAuth();
  const modules = useAdminModules();
  const clinic = useClinic();
  const query = useClientQuery(clinic.home);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const largeWeb = Platform.OS === 'web' && width >= 1440;

  const metrics: Metric[] = [
    { label: 'Turnos de hoy', value: query.data?.todayCount ?? null, icon: 'calendar-outline' },
    { label: 'Solicitudes pendientes', value: query.data?.pendingCount ?? null, icon: 'time-outline' },
    { label: 'Reservas pendientes', value: query.data?.pendingReservations ?? null, icon: 'bag-handle-outline' },
  ].filter((metric): metric is Metric & { value: number } => metric.value !== null);

  const quickLinkCandidates: QuickLink[] = [
    { path: '/admin/agenda', title: 'Gestionar turnos', icon: 'calendar-outline' },
    { path: '/admin/reservations', title: 'Ver reservas', icon: 'bag-handle-outline' },
    { path: '/admin/patients', title: 'Consultar pacientes', icon: 'paw-outline' },
    { path: '/admin/professionals', title: 'Ver profesionales', icon: 'people-outline' },
  ];
  const quickLinks = quickLinkCandidates.filter(link => modules.some(module => module.path === link.path));

  return <PetCareScreen wide>
    <View style={styles.intro}>
      <AppText variant="caption" muted style={styles.eyebrow}>PETCARE · ADMINISTRACIÓN</AppText>
      <PetCareHeader title={`¡Hola${user?.firstName ? `, ${user.firstName}` : ''}!`} subtitle="Este es el resumen de tu clínica." />
    </View>

    <QueryState {...query} />
    {metrics.length > 0 && <View style={styles.metrics}>
      {metrics.map(metric => <View key={metric.label} style={[styles.metricCell, largeWeb && styles.metricCellLarge]}>
        <PetCareCard>
          <View style={styles.metricHeading}>
            <View style={[styles.metricIcon, { backgroundColor: colors.accent }]}>
              <Ionicons name={metric.icon} size={20} color={colors.primary} />
            </View>
            <AppText variant="title" style={styles.metricValue}>{metric.value}</AppText>
          </View>
          <AppText variant="caption" muted>{metric.label}</AppText>
        </PetCareCard>
      </View>)}
    </View>}

    {query.data?.nextAppointment && <PetCareCard>
      <AppText variant="subtitle">Próximo turno</AppText>
      <AppText>{clinicDateTime(String(query.data.nextAppointment.startsAt))}</AppText>
      <AppText muted>{String(query.data.nextAppointment.petName)} · {String(query.data.nextAppointment.service)}</AppText>
    </PetCareCard>}

    {quickLinks.length > 0 && <View style={styles.section}>
      <AppText variant="subtitle">Accesos rápidos</AppText>
      <ResponsiveGrid>{quickLinks.map(link => <PetCareAction key={link.path} title={link.title} icon={link.icon} onPress={() => router.push(link.path as never)} />)}</ResponsiveGrid>
    </View>}
    {quickLinks.length === 0 && <AppText muted>Consultá las secciones disponibles desde el menú.</AppText>}
  </PetCareScreen>;
}

const styles = StyleSheet.create({
  intro: { gap: 3 },
  eyebrow: { letterSpacing: 0.8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  metricCell: { width: '48.5%' },
  metricCellLarge: { width: '32%' },
  metricHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 28, lineHeight: 34 },
  section: { gap: 12 },
});
