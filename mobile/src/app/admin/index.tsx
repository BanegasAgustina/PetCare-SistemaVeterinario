import { useAuth } from '../../hooks/useAuth';
import { useAdminModules } from '../../components/layout/GlobalNavigation';
import { AppText } from '../../components/ui/AppText';
import { PetCareAction, PetCareScreen } from '../../components/client/PetCareUI';
import { router } from 'expo-router';

export default function AdminHome() {
  const { user } = useAuth();
  const modules = useAdminModules();
  const agenda = modules.find(module => module.path === '/admin/agenda');
  const reservations = modules.find(module => module.path === '/admin/reservations');

  return <PetCareScreen>
    <AppText variant="caption" muted>PETCARE · GESTIÓN</AppText>
    <AppText variant="title">{user?.role === 'SUPER_ADMIN' ? 'Administrador principal' : 'Administración'}</AppText>
    <AppText muted>Hola, {user?.firstName}. Revisá la actividad de tu clínica.</AppText>
    {(agenda || reservations) && <AppText variant="subtitle">Actividad</AppText>}
    {agenda && <PetCareAction title="Ver turnos" icon="calendar-outline" onPress={() => router.push(agenda.path as never)}/>}
    {reservations && <PetCareAction title="Reservas" icon="bag-handle-outline" onPress={() => router.push(reservations.path as never)}/>}
    {!agenda && !reservations && <AppText muted>Consultá las secciones disponibles desde el menú.</AppText>}
  </PetCareScreen>;
}
