/**
 * Pantalla de roles para ADMIN/SUPER_ADMIN con los permisos exigidos. Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { SelectionRow } from '../../components/ui/SelectionRow';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { QueryState,PetCareCard } from '../../components/client/PetCareUI';
import { useAdmin } from '../../hooks/useAdmin';
import { useAuth } from '../../hooks/useAuth';
import { useClientQuery } from '../../hooks/useClientQuery';
import { useFeedback } from '../../contexts/FeedbackContext';
import type { AdminRole } from '../../types/admin';
import { roleLabel } from '../../utils/role-label';
import { groupPermissionsByModule } from '../../utils/admin-permissions';
import { AdminPageHeading } from '../../components/admin/AdminPageHeading';
export default function RolesScreen() {
  const api=useAdmin();const auth=useAuth();const query=useClientQuery(api.catalog);const {showToast}=useFeedback();
  const [role,setRole]=useState<AdminRole|null>(null);const [creating,setCreating]=useState(false);const [name,setName]=useState('');const [codes,setCodes]=useState<string[]>([]);const [error,setError]=useState<string>();const [confirm,setConfirm]=useState(false);
  const editable=auth.hasPermission('permissions.manage')&&(creating?auth.hasRole('SUPER_ADMIN'):Boolean(role)&&role?.code!=='SECRETARY'&&(role?.code!=='SUPER_ADMIN'||auth.hasRole('SUPER_ADMIN')));
  function startCreate(){setRole(null);setCreating(true);setName('');setCodes([]);setError(undefined);}
  return <ScreenContainer wide><AdminPageHeading title="Roles"/><QueryState {...query}/>
    {query.data&&<>{auth.hasRole('SUPER_ADMIN')&&<AppButton label="Crear rol personalizado" onPress={startCreate}/ >}{query.data.roles.map(item=><SelectionRow radio key={item.id} label={`${roleLabel(item.code,item.name)} · ${item.assignedUsers} usuarios`} checked={role?.id===item.id&&!creating} onPress={()=>{setRole(item);setCreating(false);setName(roleLabel(item.code,item.name));setCodes(item.permissions);setError(undefined);}}/>)}
      {(role||creating)&&<PetCareCard><AppInput label="Nombre del rol" value={name} maxLength={60} editable={editable} error={error} onChangeText={v=>{setName(v);setError(undefined);}}/>{role&&<AppText muted>{role.code==='SECRETARY'?'Rol retirado para nuevas asignaciones. Su configuración se conserva para las cuentas existentes.':'Los permisos afectan a todas las cuentas que usan este rol.'}</AppText>}
        {creating&&<AppText muted>El nuevo rol quedará disponible para asignarlo a usuarios.</AppText>}
        {groupPermissionsByModule(query.data.permissions).map(group=><View key={group.name} style={{gap:8}}><AppText variant="subtitle">{group.name}</AppText>{group.permissions.map(permission=><SelectionRow key={permission.code} label={permission.name} hint={permission.description} checked={codes.includes(permission.code)} disabled={!editable||!permission.canDelegate||permission.critical&&(creating||!['ADMIN','SUPER_ADMIN'].includes(role?.code??''))} onPress={()=>setCodes(v=>v.includes(permission.code)?v.filter(c=>c!==permission.code):[...v,permission.code])}/>)}</View>)}
        {editable&&<AppButton label={creating?'Revisar y crear rol':'Revisar y guardar rol'} onPress={()=>{if(!name.trim()){setError('Ingresá el nombre del rol.');return;}setConfirm(true);}}/>}
      </PetCareCard>}
    </>}
    <ConfirmModal visible={confirm} title={creating?'Crear rol personalizado':'Actualizar rol y permisos'} message={creating?'¿Querés crear este rol con los permisos seleccionados?':'Los permisos cambiarán los accesos de todas las personas con este rol. Las excepciones individuales se conservarán. ¿Querés guardar los cambios?'} confirmLabel={creating?'Crear rol':'Guardar cambios'} onCancel={()=>setConfirm(false)} onConfirm={async()=>{if(creating)await api.createRole(name,codes);else if(role)await api.updateRole(role.id,name,codes);setConfirm(false);setRole(null);setCreating(false);query.reload();await auth.refreshProfile();showToast(creating?'Rol creado':'Rol actualizado','success');}}/>
  </ScreenContainer>;
}
