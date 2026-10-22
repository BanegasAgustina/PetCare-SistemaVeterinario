/**
 * Navegador del módulo client, para CLIENT autenticado. Organiza las rutas; el backend comprueba nuevamente autorización y ownership.
 */
import { router,Stack,usePathname } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { canEnterPersonalPath } from '../../utils/personal-route-access';
import { roleHome } from '../../utils/role-home';
export default function ClientLayout(){const {colors}=useTheme();const {user}=useAuth();const pathname=usePathname();
  if(!canEnterPersonalPath(user?.role??'',user?.permissions,pathname))return <ScreenContainer><AppText variant="title">Acceso denegado</AppText><AppText muted>No tenés permiso para abrir esta función personal.</AppText><AppButton label="Volver a mi espacio" onPress={()=>router.replace(roleHome(user) as never)}/></ScreenContainer>;
  return <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background}}}/>;
}
