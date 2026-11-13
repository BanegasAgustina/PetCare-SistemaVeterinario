/**
 * ARCHIVO: roles.tsx
 * UBICACIÓN: mobile/src/app/admin/roles.tsx
 * FUNCIÓN: Gestión administrativa de roles y permisos compartidos.
 * RESPONSABILIDAD: Carga catálogo, edita nombre/permisos, crea o elimina roles personalizados con confirmaciones.
 * CONEXIONES: Importa: mobile/src/components/layout/ScreenContainer.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/SelectionRow.tsx, mobile/src/components/ui/ConfirmModal.tsx, mobile/src/components/client/PetCareUI.tsx y 9 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: useAdmin → endpoints de roles/permisos; `admin.repository.ts` valida delegación y protección de roles del sistema.
 * IMPORTANCIA: Organiza capacidades por rol sin saltarse las reglas de privilegio del backend.
 */
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

/** Normaliza texto para filtrar permisos sin distinguir mayúsculas ni acentos. */
function normalizePermissionText(value:string){return value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');}

/** Carga roles y permisos, administra cambios y presenta confirmación para mutaciones sensibles. */
export default function RolesScreen() {
  const api=useAdmin();const auth=useAuth();const query=useClientQuery(api.catalog);const {showToast}=useFeedback();
  const [role,setRole]=useState<AdminRole|null>(null);const [creating,setCreating]=useState(false);const [name,setName]=useState('');const [codes,setCodes]=useState<string[]>([]);const [isActive,setIsActive]=useState(true);const [permissionSearch,setPermissionSearch]=useState('');const [error,setError]=useState<string>();const [confirm,setConfirm]=useState(false);const [deleteConfirm,setDeleteConfirm]=useState(false);
  const canManageRoles=auth.hasPermission('roles.manage');const canManagePermissions=auth.hasPermission('permissions.manage');
  const canCreateRole=auth.hasRole('SUPER_ADMIN')&&canManageRoles&&canManagePermissions;
  const editable=canManageRoles&&canManagePermissions&&(creating?auth.hasRole('SUPER_ADMIN'):Boolean(role)&&(role?.code!=='SUPER_ADMIN'||auth.hasRole('SUPER_ADMIN')));
  const deletable=Boolean(role&&!creating&&canManageRoles&&canManagePermissions&&role.assignedUsers===0&&!['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(role.code));
  const searchTerm=normalizePermissionText(permissionSearch.trim());
  const permissionGroups=query.data?groupPermissionsByModule(query.data.permissions.filter(permission=>!searchTerm||[permission.name,permission.description,permission.code,permission.moduleName].some(value=>normalizePermissionText(String(value)).includes(searchTerm)))):[];

  /** Abre el alta de rol con nombre y permisos vacíos. */
  function startCreate(){setRole(null);setCreating(true);setName('');setCodes([]);setIsActive(true);setPermissionSearch('');setError(undefined);}
  /** Descarta el borrador de rol y cierra el modo de creación. */
  function cancelCreate(){setCreating(false);setName('');setCodes([]);setIsActive(true);setPermissionSearch('');setError(undefined);}
  /** Valida que el rol tenga nombre y abre la confirmación antes de crearlo. */
  function reviewCreate(){if(!name.trim()){setError('Ingresá el nombre del rol.');return;}setConfirm(true);}
  /** Carga el rol seleccionado en el formulario de edición. */
  function selectRole(item:AdminRole){setRole(item);setCreating(false);setName(roleLabel(item.code,item.name));setCodes(item.permissions);setIsActive(item.isActive);setPermissionSearch('');setError(undefined);}
  /** Elimina el rol seleccionado, actualiza permisos/perfil y muestra el resultado. */
  async function deleteRole(){if(!role)return;const deleted=role;await api.deleteRole(deleted.id);setDeleteConfirm(false);setRole(null);setCreating(false);query.reload();await auth.refreshProfile();showToast(`Rol “${deleted.name}” eliminado`,'success');}
  /** Crea o actualiza el rol, refresca los datos y confirma el resultado al usuario. */
  async function saveRole(){
    if(creating){await api.createRole(name.trim(),codes);cancelCreate();}
    else if(role){await api.updateRole(role.id,name.trim(),codes,isActive);setRole(null);}
    setConfirm(false);query.reload();await auth.refreshProfile();showToast(creating?'Rol creado':'Rol actualizado','success');
  }

  return <ScreenContainer wide>
    <AdminPageHeading title="Roles"/>
    <QueryState {...query}/>
    {query.data&&<>
      {canCreateRole&&<AppButton compact label="Crear rol personalizado" onPress={startCreate}/>}
      {query.data.roles.map(item=><View key={item.id} style={{flexDirection:'row',alignItems:'center',gap:6}}>
        <View style={{flex:1}}><SelectionRow radio label={`${roleLabel(item.code,item.name)} · ${item.assignedUsers} usuarios · ${item.isActive?'Activo':'Desactivado'}`} checked={role?.id===item.id&&!creating} onPress={()=>selectRole(item)}/></View>
        {canManageRoles&&canManagePermissions&&item.assignedUsers===0&&!['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN','SECRETARY'].includes(item.code)&&<Pressable accessibilityRole="button" accessibilityLabel={`Eliminar rol ${item.name}`} onPress={()=>{selectRole(item);setDeleteConfirm(true);}} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="trash-outline" size={19} color="#b42318"/></Pressable>}
      </View>)}
      {role&&<PetCareCard>
        <AppInput label="Nombre del rol" value={name} maxLength={60} editable={editable} error={error} onChangeText={value=>{setName(value);setError(undefined);}}/>
        {canCreateRole&&!['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(role.code)&&<AppButton compact variant="secondary" label={isActive?'Desactivar rol':'Reactivar rol'} onPress={()=>{setIsActive(value=>!value);setConfirm(true);}}/>}
        <AppText muted>Los permisos afectan a todas las cuentas que usan este rol.</AppText>
        <AppInput icon="search-outline" label="Buscar permisos" placeholder="Ej.: recomendar productos o aceptar turnos" value={permissionSearch} onChangeText={setPermissionSearch}/>
        {permissionGroups.length?permissionGroups.map(group=><View key={group.name} style={{gap:8}}>
          <AppText variant="subtitle">{group.name}</AppText>
          {group.permissions.map(permission=><SelectionRow key={permission.code} label={permission.name} hint={permission.description} checked={codes.includes(permission.code)} disabled={!editable||!permission.canDelegate||permission.critical&&!['ADMIN','SUPER_ADMIN'].includes(role.code)} onPress={()=>setCodes(current=>current.includes(permission.code)?current.filter(code=>code!==permission.code):[...current,permission.code])}/>)}
        </View>):<AppText muted>No se encontraron permisos con esa búsqueda.</AppText>}
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
      <AppInput icon="search-outline" label="Buscar permisos" placeholder="Ej.: recomendar productos o aceptar turnos" value={permissionSearch} onChangeText={setPermissionSearch}/>
      {permissionGroups.length?permissionGroups.map(group=><View key={group.name} style={{gap:8}}>
        <AppText variant="subtitle">{group.name}</AppText>
        {group.permissions.map(permission=><SelectionRow key={permission.code} label={permission.name} hint={permission.description} checked={codes.includes(permission.code)} disabled={!editable||!permission.canDelegate||permission.critical} onPress={()=>setCodes(current=>current.includes(permission.code)?current.filter(code=>code!==permission.code):[...current,permission.code])}/>)}
      </View>):<AppText muted>No se encontraron permisos con esa búsqueda.</AppText>}
    </AppModal>

    <ConfirmModal visible={confirm} title={creating?'Crear rol personalizado':isActive?'Actualizar rol y permisos':'Desactivar rol'} message={creating?'¿Querés crear este rol con los permisos seleccionados?':role&&role.isActive&&!isActive?'Las personas asignadas perderán el acceso al iniciar su siguiente solicitud. Podés reactivar el rol más tarde. ¿Querés continuar?':'Los permisos y el estado cambiarán para todas las personas con este rol. ¿Querés guardar los cambios?'} confirmLabel={creating?'Crear rol':isActive?'Guardar cambios':'Desactivar rol'} onCancel={()=>{setIsActive(role?.isActive??true);setConfirm(false);}} onConfirm={saveRole}/>
    {role&&<ConfirmNameModal visible={deleteConfirm} title="Eliminar rol personalizado" message="Esta acción elimina el rol y sus permisos asociados. La API volverá a comprobar que no sea un rol del sistema y que no tenga usuarios asignados." expectedName={role.name} identityHint={`Rol ID ${role.id}. La eliminación queda registrada en la auditoría administrativa.`} confirmLabel="Eliminar rol" onCancel={()=>setDeleteConfirm(false)} onConfirm={deleteRole}/ >}
  </ScreenContainer>;
}
