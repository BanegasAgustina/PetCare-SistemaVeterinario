/**
 * ARCHIVO: permissions.tsx
 * UBICACIÓN: mobile/src/app/admin/permissions.tsx
 * FUNCIÓN: Pantalla o ruta de la aplicación.
 * RESPONSABILIDAD: Pantalla o ruta de la aplicación dentro de PetCare; agrupa las declaraciones de permissions.
 * CONEXIONES: Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/utils/admin-permissions.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Recibe estado de navegación, contexto y/o parámetros; construye la interfaz y conecta acciones del usuario con hooks y servicios.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Pantalla de permisos efectivos para ADMIN/SUPER_ADMIN con los permisos exigidos. Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { router } from 'expo-router';
import { View } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { QueryState,PetCareCard } from '../../components/client/PetCareUI';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { groupPermissionsByModule } from '../../utils/admin-permissions';
import { AdminPageHeading } from '../../components/admin/AdminPageHeading';
// Función PermissionsScreen: concentra la lógica dentro de este módulo.
export default function PermissionsScreen(){const api=useAdmin();const auth=useAuth();const query=useClientQuery(api.catalog);
  return <ScreenContainer wide><AdminPageHeading title="Permisos"/>
<QueryState {...query}/>
    <AppText muted>Los roles definen permisos compartidos y cada usuario puede tener excepciones individuales.</AppText>
    {auth.hasPermission('roles.manage')&&<AppButton label="Gestionar permisos de roles" onPress={()=>router.push('/admin/roles')}/>}
    {auth.hasPermission('users.manage')&&<AppButton label="Gestionar excepciones de usuarios" onPress={()=>router.push('/admin/users')}/>}
    {query.data&&groupPermissionsByModule(query.data.permissions).map(group=><View key={group.name} style={{gap:10}}><AppText variant="subtitle">{group.name}</AppText>{group.permissions.map(permission=><PetCareCard key={permission.id}><AppText variant="subtitle">{permission.name}</AppText><AppText>{permission.description}</AppText><AppText muted>{permission.canDelegate?'Disponible para delegar':'No poseés este permiso'}</AppText></PetCareCard>)}</View>)}
  </ScreenContainer>;
}
