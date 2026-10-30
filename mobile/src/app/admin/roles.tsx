// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

/**
 * Pantalla de roles para ADMIN/SUPER_ADMIN con los permisos exigidos. Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación); no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../components/layout/ScreenContainer';
import { AppText } from '../../components/ui/AppText';
import { AppInput } from '../../components/forms/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppModal } from '../../components/ui/AppModal';
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
import { ConfirmNameModal } from '../../components/admin/ConfirmNameModal';

export default function RolesScreen() {
  const api=useAdmin();const auth=useAuth();const query=useClientQuery(api.catalog);const {showToast}=useFeedback();
  const [role,setRole]=useState<AdminRole|null>(null);const [creating,setCreating]=useState(false);const [name,setName]=useState('');const [codes,setCodes]=useState<string[]>([]);const [error,setError]=useState<string>();const [confirm,setConfirm]=useState(false);const [deleteConfirm,setDeleteConfirm]=useState(false);
  const canManageRoles=auth.hasPermission('roles.manage');const canManagePermissions=auth.hasPermission('permissions.manage');
  const canCreateRole=auth.hasRole('SUPER_ADMIN')&&canManageRoles&&canManagePermissions;
  const editable=canManageRoles&&canManagePermissions&&(creating?auth.hasRole('SUPER_ADMIN'):Boolean(role)&&(role?.code!=='SUPER_ADMIN'||auth.hasRole('SUPER_ADMIN')));
  const deletable=Boolean(role&&!creating&&canManageRoles&&canManagePermissions&&role.assignedUsers===0&&!['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(role.code));

  function startCreate(){setRole(null);setCreating(true);setName('');setCodes([]);setError(undefined);}
  function cancelCreate(){setCreating(false);setName('');setCodes([]);setError(undefined);}
  function reviewCreate(){if(!name.trim()){setError('Ingresá el nombre del rol.');return;}setConfirm(true);}
  function selectRole(item:AdminRole){setRole(item);setCreating(false);setName(roleLabel(item.code,item.name));setCodes(item.permissions);setError(undefined);}
  async function deleteRole(){if(!role)return;const deleted=role;await api.deleteRole(deleted.id);setDeleteConfirm(false);setRole(null);setCreating(false);query.reload();await auth.refreshProfile();showToast(`Rol “${deleted.name}” eliminado`,'success');}
  async function saveRole(){
    if(creating){await api.createRole(name.trim(),codes);cancelCreate();}
    else if(role){await api.updateRole(role.id,name.trim(),codes);setRole(null);}
    setConfirm(false);query.reload();await auth.refreshProfile();showToast(creating?'Rol creado':'Rol actualizado','success');
  }

  return <ScreenContainer wide>
    <AdminPageHeading title="Roles"/>
    <QueryState {...query}/>
    {query.data&&<>
      {canCreateRole&&<AppButton compact label="Crear rol personalizado" onPress={startCreate}/>}
      {query.data.roles.map(item=><View key={item.id} style={{flexDirection:'row',alignItems:'center',gap:6}}>
        <View style={{flex:1}}><SelectionRow radio label={`${roleLabel(item.code,item.name)} · ${item.assignedUsers} usuarios`} checked={role?.id===item.id&&!creating} onPress={()=>selectRole(item)}/></View>
        {canManageRoles&&canManagePermissions&&item.assignedUsers===0&&!['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN','SECRETARY'].includes(item.code)&&<Pressable accessibilityRole="button" accessibilityLabel={`Eliminar rol ${item.name}`} onPress={()=>{selectRole(item);setDeleteConfirm(true);}} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="trash-outline" size={19} color="#b42318"/></Pressable>}
      </View>)}
      {role&&<PetCareCard>
        <AppInput label="Nombre del rol" value={name} maxLength={60} editable={editable} error={error} onChangeText={value=>{setName(value);setError(undefined);}}/>
        <AppText muted>Los permisos afectan a todas las cuentas que usan este rol.</AppText>
        {groupPermissionsByModule(query.data.permissions).map(group=><View key={group.name} style={{gap:8}}>
          <AppText variant="subtitle">{group.name}</AppText>
          {group.permissions.map(permission=><SelectionRow key={permission.code} label={permission.name} hint={permission.description} checked={codes.includes(permission.code)} disabled={!editable||!permission.canDelegate||permission.critical&&!['ADMIN','SUPER_ADMIN'].includes(role.code)} onPress={()=>setCodes(current=>current.includes(permission.code)?current.filter(code=>code!==permission.code):[...current,permission.code])}/>)}
        </View>)}
        {editable&&<AppButton compact label="Revisar y guardar rol" onPress={()=>{if(!name.trim()){setError('Ingresá el nombre del rol.');return;}setConfirm(true);}}/>}
        {deletable&&<AppButton compact variant="secondary" destructive label="Eliminar rol" onPress={()=>setDeleteConfirm(true)}/>}
      </PetCareCard>}
    </>}

    <AppModal visible={creating&&!confirm} dismissible onClose={cancelCreate} size="wide" footer={<View style={{flexDirection:'row',justifyContent:'flex-end',flexWrap:'wrap',gap:10}}>
      <AppButton compact variant="secondary" label="Cancelar" onPress={cancelCreate}/>
      <AppButton compact label="Revisar y crear rol" onPress={reviewCreate}/>
    </View>}>
      <AppText variant="subtitle" accessibilityRole="header">Crear rol personalizado</AppText>
      <AppText muted>El nuevo rol quedará disponible para asignarlo a usuarios. Elegí los permisos que correspondan.</AppText>
      <AppInput label="Nombre del rol" required value={name} maxLength={60} editable={editable} error={error} onChangeText={value=>{setName(value);setError(undefined);}}/>
      {query.data&&groupPermissionsByModule(query.data.permissions).map(group=><View key={group.name} style={{gap:8}}>
        <AppText variant="subtitle">{group.name}</AppText>
        {group.permissions.map(permission=><SelectionRow key={permission.code} label={permission.name} hint={permission.description} checked={codes.includes(permission.code)} disabled={!editable||!permission.canDelegate||permission.critical} onPress={()=>setCodes(current=>current.includes(permission.code)?current.filter(code=>code!==permission.code):[...current,permission.code])}/>)}
      </View>)}
    </AppModal>

    <ConfirmModal visible={confirm} title={creating?'Crear rol personalizado':'Actualizar rol y permisos'} message={creating?'¿Querés crear este rol con los permisos seleccionados?':'Los permisos cambiarán los accesos de todas las personas con este rol. Las excepciones individuales se conservarán. ¿Querés guardar los cambios?'} confirmLabel={creating?'Crear rol':'Guardar cambios'} onCancel={()=>setConfirm(false)} onConfirm={saveRole}/>
    {role&&<ConfirmNameModal visible={deleteConfirm} title="Eliminar rol personalizado" message="Esta acción elimina el rol y sus permisos asociados. La API volverá a comprobar que no sea un rol del sistema y que no tenga usuarios asignados." expectedName={role.name} identityHint={`Rol ID ${role.id}. La eliminación queda registrada en la auditoría administrativa.`} confirmLabel="Eliminar rol" onCancel={()=>setDeleteConfirm(false)} onConfirm={deleteRole}/ >}
  </ScreenContainer>;
}
