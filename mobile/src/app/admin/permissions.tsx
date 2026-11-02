/**
 * ARCHIVO: permissions.tsx
 * UBICACIÓN: mobile/src/app/admin/permissions.tsx
 * FUNCIÓN: Vista de permisos disponibles y accesos de gestión administrativa.
 * RESPONSABILIDAD: Agrupa permisos por módulo y muestra acciones de roles/excepciones según permisos actuales del actor.
 * CONEXIONES: Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/hooks/useAdmin.ts, mobile/src/hooks/useAuth.ts, mobile/src/hooks/useClientQuery.ts, mobile/src/utils/admin-permissions.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: useAdmin/useAuth → catálogo backend; groupPermissionsByModule prepara categorías de presentación.
 * IMPORTANCIA: Ayuda a entender permisos efectivos; la autorización real sigue en middleware/backend.
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
/** Carga catálogo de permisos, agrupa su presentación y muestra acciones según capacidades del usuario. */
export default function PermissionsScreen(){const api=useAdmin();const auth=useAuth();const query=useClientQuery(api.catalog);
  return <ScreenContainer wide><AdminPageHeading title="Permisos"/>
<QueryState {...query}/>
    <AppText muted>Los roles definen permisos compartidos y cada usuario puede tener excepciones individuales.</AppText>
    {auth.hasPermission('roles.manage')&&<AppButton label="Gestionar permisos de roles" onPress={()=>router.push('/admin/roles')}/>}
    {auth.hasPermission('users.manage')&&<AppButton label="Gestionar excepciones de usuarios" onPress={()=>router.push('/admin/users')}/>}
    {query.data&&groupPermissionsByModule(query.data.permissions).map(group=><View key={group.name} style={{gap:10}}><AppText variant="subtitle">{group.name}</AppText>{group.permissions.map(permission=><PetCareCard key={permission.id}><AppText variant="subtitle">{permission.name}</AppText><AppText>{permission.description}</AppText><AppText muted>{permission.canDelegate?'Disponible para delegar':'No poseés este permiso'}</AppText></PetCareCard>)}</View>)}
  </ScreenContainer>;
}
