import { router } from 'expo-router';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppButton } from '../../components/ui/AppButton';
import { QueryState,PetCareCard } from '../../components/client/PetCareUI';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
export default function PermissionsScreen(){const api=useAdmin();const auth=useAuth();const query=useClientQuery(api.catalog);
  return <ScreenContainer><AppButton variant="secondary" label="Volver a Gestión" onPress={()=>router.replace('/admin')}/><AppText variant="title">Permisos</AppText><QueryState {...query}/>
    <AppText muted>Catálogo real de MySQL. Los roles definen herencia y cada usuario puede tener excepciones concedidas o denegadas.</AppText>
    {auth.hasPermission('roles.manage')&&<AppButton label="Gestionar permisos de roles" onPress={()=>router.push('/admin/roles')}/>}
    {auth.hasPermission('users.manage')&&<AppButton label="Gestionar excepciones de usuarios" onPress={()=>router.push('/admin/users')}/>}
    {query.data?.permissions.map(permission=><PetCareCard key={permission.id}><AppText variant="subtitle">{permission.name}</AppText><AppText>{permission.description}</AppText><AppText variant="caption" muted>{permission.moduleName} · {permission.code}</AppText><AppText muted>{permission.canDelegate?'Disponible para delegar':'No poseés este permiso'}</AppText></PetCareCard>)}
  </ScreenContainer>;
}
