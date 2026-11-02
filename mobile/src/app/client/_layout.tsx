/**
 * ARCHIVO: _layout.tsx
 * UBICACIÓN: mobile/src/app/client/_layout.tsx
 * FUNCIÓN: Protege y compone el grupo autenticado de rutas CLIENT.
 * RESPONSABILIDAD: Evalúa rol, permisos y pathname para permitir acceso personal; muestra denegación o monta Stack con tema.
 * CONEXIONES: Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useTheme.ts, mobile/src/utils/personal-route-access.ts, mobile/src/utils/role-home.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router aplica el layout de cliente; useAuth, useTheme y personal-route-access resuelven presentación y navegación.
 * IMPORTANCIA: Centraliza navegación del cliente sin sustituir los chequeos de ownership en backend.
 */
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
/** Comprueba acceso personal para pathname/rol y aplica tema al Stack; ante denegación ofrece volver al inicio del rol. */
export default function ClientLayout(){const {colors}=useTheme();const {user}=useAuth();const pathname=usePathname();
  if(!canEnterPersonalPath(user?.role??'',user?.permissions,pathname))return <ScreenContainer><AppText variant="title">Acceso denegado</AppText><AppText muted>No tenés permiso para abrir esta función personal.</AppText><AppButton label="Volver a mi espacio" onPress={()=>router.replace(roleHome(user) as never)}/></ScreenContainer>;
  return <Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:colors.background}}}/>;
}
