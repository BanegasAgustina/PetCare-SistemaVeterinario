import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useClinic } from '../../hooks/useClinic';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useAdminModules, useAdminModulesLoading } from '../../components/layout/GlobalNavigation';
import { AppText } from '../../components/ui/AppText';
import { PetCareAction, PetCareCard, PetCareHeader, PetCareScreen, QueryState, ResponsiveGrid, type IconName } from '../../components/client/PetCareUI';
import { useTheme } from '../../hooks/useTheme';
import { clinicDateTime } from '../../utils/clinic-date';

type Metric = { label: string; value: number | null; icon: IconName };
type AdminTask = { path: string; title: string; group: 'ClÃ­nica' | 'Tienda' | 'AdministraciÃ³n'; icon: IconName };
const taskByPath: Record<string, Omit<AdminTask, 'path'>> = {
  '/admin/patients': { title: 'Buscar pacientes', group: 'ClÃ­nica', icon: 'paw-outline' },
  '/admin/agenda': { title: 'Administrar turnos', group: 'ClÃ­nica', icon: 'calendar-outline' },
  '/admin/veterinarians': { title: 'Administrar veterinarios', group: 'ClÃ­nica', icon: 'medkit-outline' },
  '/admin/professionals': { title: 'Administrar profesionales', group: 'ClÃ­nica', icon: 'people-outline' },
  '/admin/catalog/services': { title: 'Administrar servicios', group: 'ClÃ­nica', icon: 'pricetags-outline' },
  '/admin/availability': { title: 'Publicar horarios de servicios', group: 'ClÃ­nica', icon: 'calendar-outline' },
  '/admin/specialties': { title: 'Administrar tipos y especialidades', group: 'ClÃ­nica', icon: 'list-outline' },
  '/admin/reservations': { title: 'Gestionar reservas para retiro', group: 'Tienda', icon: 'bag-handle-outline' },
  '/admin/products': { title: 'Actualizar precios y stock', group: 'Tienda', icon: 'pricetags-outline' },
  '/admin/catalog/products': { title: 'Crear y editar productos', group: 'Tienda', icon: 'cube-outline' },
  '/admin/catalog/categories': { title: 'Administrar categorías', group: 'Tienda', icon: 'grid-outline' },
  '/admin/catalog/promotions': { title: 'Promociones y banners', group: 'Tienda', icon: 'pricetag-outline' },
  '/admin/store-settings': { title: 'Retiro y envíos', group: 'Tienda', icon: 'bicycle-outline' },
  '/admin/store-orders': { title: 'Gestionar pedidos de tienda', group: 'Tienda', icon: 'bag-check-outline' },
  '/admin/users': { title: 'Administrar usuarios', group: 'AdministraciÃ³n', icon: 'people-outline' },
  '/admin/roles': { title: 'Administrar roles', group: 'AdministraciÃ³n', icon: 'shield-checkmark-outline' },
  '/admin/permissions': { title: 'Consultar permisos', group: 'AdministraciÃ³n', icon: 'key-outline' },
};
const taskGroups: AdminTask['group'][] = ['ClÃ­nica', 'Tienda', 'AdministraciÃ³n'];

export default function AdminHome() {
  const { user, hasPermission } = useAuth();
  const modules = useAdminModules();
  const modulesLoading = useAdminModulesLoading();
  const clinic = useClinic();
  const query = useClientQuery(clinic.home);
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const desktopWeb = Platform.OS === 'web' && width >= 1024;

  const metrics: Metric[] = [
    { label: 'Turnos de hoy', value: query.data?.todayCount ?? null, icon: 'calendar-outline' },
    { label: 'Solicitudes pendientes', value: query.data?.pendingCount ?? null, icon: 'time-outline' },
    { label: 'Reservas pendientes', value: query.data?.pendingReservations ?? null, icon: 'bag-handle-outline' },
  ].filter((metric): metric is Metric & { value: number } => metric.value !== null);

  const tasks: AdminTask[] = modules.flatMap(module => {
    const task = taskByPath[module.path];
    return task ? [{ path: module.path, ...task }] : [];
  });
  if (hasPermission('schedule.manage') && !tasks.some(task => task.path === '/admin/availability')) tasks.push({ path: '/admin/availability', ...taskByPath['/admin/availability'] });

  return <PetCareScreen wide>
    <View style={styles.intro}>
      <AppText variant="caption" muted style={styles.eyebrow}>PETCARE Â· ADMINISTRACIÃ“N</AppText>
      <PetCareHeader title={`Â¡Hola${user?.firstName ? `, ${user.firstName}` : ''}!`} subtitle="Este es el resumen de tu clÃ­nica." />
    </View>

    <QueryState {...query} />
    {metrics.length > 0 && <View style={styles.metrics}>
      {metrics.map(metric => <View key={metric.label} style={[styles.metricCell, desktopWeb && styles.metricCellDesktop]}>
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

    {query.data?.nextAppointment && <View style={desktopWeb && styles.desktopOverviewColumn}><PetCareCard>
        <AppText variant="subtitle">PrÃ³ximo turno</AppText>
        <AppText>{clinicDateTime(String(query.data.nextAppointment.startsAt))}</AppText>
        <AppText muted>{String(query.data.nextAppointment.petName)} Â· {String(query.data.nextAppointment.service)}</AppText>
      </PetCareCard></View>}

    <View style={styles.section}>
      <AppText variant="subtitle">Tareas disponibles</AppText>
      {taskGroups.map(group => {
        const groupTasks = tasks.filter(task => task.group === group);
        if (!groupTasks.length) return null;
        return <View key={group} style={styles.section}>
          <AppText variant="caption" muted>{group}</AppText>
          <ResponsiveGrid>{groupTasks.map(task => <PetCareAction key={task.path} title={task.title} icon={task.icon} onPress={() => router.push(task.path as never)} />)}</ResponsiveGrid>
        </View>;
      })}
      {!modulesLoading && tasks.length === 0 && <AppText muted>Esta cuenta todavÃ­a no tiene tareas administrativas disponibles.</AppText>}
    </View>
  </PetCareScreen>;
}

const styles = StyleSheet.create({
  intro: { gap: 3 },
  eyebrow: { letterSpacing: 0.8 },
  metrics: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  metricCell: { width: '48.5%' },
  metricCellDesktop: { width: '32%' },
  metricHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metricIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  metricValue: { fontSize: 28, lineHeight: 34 },
  section: { gap: 12 },
  desktopOverviewColumn: { flex: 1, minWidth: 0 },
});
