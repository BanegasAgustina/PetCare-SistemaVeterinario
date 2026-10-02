import { router } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { useAuth } from '../../hooks/useAuth';
export default function AdminHome() {
  const { user }=useAuth();
  return <ScreenContainer>
    <AppText variant="caption" muted>PETCARE · {user?.role==='SUPER_ADMIN'?'SUPER ADMIN':'ADMIN'}</AppText>
    <AppText variant="title">Gestión</AppText>
    {user?.role==='SUPER_ADMIN' && user.permissions?.includes('veterinarians.manage') &&
      <AppButton label="Veterinarios" onPress={()=>router.push('/admin/veterinarians')} />}
    <AppButton label="Mi cuenta" variant="secondary" onPress={()=>router.push('/account')} />
  </ScreenContainer>;
}
