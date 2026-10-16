/**
 * Pantalla de usuarios para ADMIN/SUPER_ADMIN con los permisos exigidos.
 * Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación);
 *  no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useEffect,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppText } from '../../../components/ui/AppText';
import { AppInput } from '../../../components/forms/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { PetImage,QueryState,ResponsiveGrid } from '../../../components/client/PetCareUI';
import { AdminPersonRow } from '../../../components/admin/AdminPersonRow';
import { useAdmin } from '../../../hooks/useAdmin';
import { useAuth } from '../../../hooks/useAuth';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { roleLabel } from '../../../utils/role-label';
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { CompactPagination } from '../../../components/ui/CompactPagination';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { AppModal } from '../../../components/ui/AppModal';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { FormNotice } from '../../../components/ui/FormNotice';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../../../components/forms/ProfilePhotoInput';
import { validateIdentityForm } from '../../../utils/auth-validation';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { friendlyError } from '../../../services/api';
import { AdminFormActions, AdminFormSection } from '../../../components/admin/AdminFormLayout';
import type { AdminUserDetail } from '../../../types/admin';
const empty={firstName:'',lastName:'',email:'',phone:'',roleId:'',isActive:true};
export default function UsersScreen() {
  const {create}=useLocalSearchParams<{create?:string}>();
  const api=useAdmin();const auth=useAuth();const action=useAsyncAction();const {showToast}=useFeedback();const [search,setSearch]=useState('');const [filter,setFilter]=useState('');const [status,setStatus]=useState('all');const [page,setPage]=useState(1);
  const [createOpen,setCreateOpen]=useState(false);const [createValues,setCreateValues]=useState(empty);const [createErrors,setCreateErrors]=useState<Partial<Record<keyof typeof empty,string>>>({});const [createPhoto,setCreatePhoto]=useState<PickedProfilePhoto|null>(null);
  const load=useCallback(()=>api.users(filter,page,status),[api,filter,page,status]);const query=useClientQuery(load);
  const [selectedUserId,setSelectedUserId]=useState<string|null>(null);const [selectedUser,setSelectedUser]=useState<AdminUserDetail|null>(null);const [detailLoading,setDetailLoading]=useState(false);const [detailError,setDetailError]=useState<string|null>(null);const [statusTarget,setStatusTarget]=useState<boolean|null>(null);
  useEffect(()=>{if(!selectedUserId)return;let current=true;void api.user(selectedUserId).then(user=>{if(current)setSelectedUser(user);}).catch(error=>{if(current)setDetailError(friendlyError(error));}).finally(()=>{if(current)setDetailLoading(false);});return()=>{current=false;};},[api,selectedUserId]);
  const catalog=useClientQuery(api.catalog);const selectedRole=catalog.data?.roles.find(role=>role.id===createValues.roleId);const photoRole=['VETERINARIAN','GROOMER','SECRETARY'].includes(selectedRole?.code??'');const canCreate=auth.hasPermission('roles.manage');
  function openVeterinarianCreation(){router.setParams({create:undefined});setCreateOpen(false);router.push({pathname:'/admin/veterinarians',params:{create:'1'}});}
  function changeCreate<K extends keyof typeof empty>(key:K,value:(typeof empty)[K]){setCreateValues(current=>({...current,[key]:value}));setCreateErrors(current=>({...current,[key]:undefined}));}
  function openUserDetails(id:string){setSelectedUserId(id);setSelectedUser(null);setDetailError(null);setDetailLoading(true);}
  async function saveUserStatus(){if(!selectedUser||statusTarget===null)return;const updated=await api.updateUser(selectedUser.id,{firstName:selectedUser.firstName,lastName:selectedUser.lastName,phone:selectedUser.phone,isActive:statusTarget});setSelectedUser(updated);setStatusTarget(null);query.reload();showToast(statusTarget?'Usuario activado':'Usuario desactivado','success');}
  function createUser(){const identity=validateIdentityForm(createValues);const errors={...identity,...(!createValues.roleId?{roleId:'Seleccioná un rol.'}:{})};setCreateErrors(errors);if(Object.values(errors).some(Boolean))return;void action.run(async()=>{const result=await api.createUser({firstName:createValues.firstName,lastName:createValues.lastName,email:createValues.email,phone:createValues.phone||null,roleId:createValues.roleId});let photoFailed=false;if(createPhoto&&photoRole){try{await api.updateUserPhoto(result.user.id,{photoBase64:createPhoto.base64});}catch{photoFailed=true;}}setCreateOpen(false);query.reload();showToast(photoFailed?'Cuenta creada; no se pudo guardar la foto. Podés reintentar en el perfil.':'Cuenta creada. Comunicá la contraseña inicial al empleado por un canal seguro; deberá verificar su correo y cambiarla.',photoFailed?'info':'success');router.replace({pathname:'/admin/users/[id]',params:{id:result.user.id}});});}
  return <ScreenContainer wide><AppText variant="title">Usuarios</AppText>
    <SearchFilterBar><AppInput icon="search-outline" label="Buscar usuarios" placeholder="Nombre o correo electrónico" value={search} onChangeText={value=>{setSearch(value);setPage(1);setFilter(value.trim());}} returnKeyType="search" onSubmitEditing={()=>{setPage(1);setFilter(search.trim());}}/><FilterDisclosure fullWidth activeCount={status==='all'?0:1} onApply={()=>setPage(1)} onClear={()=>{setStatus('all');setPage(1);}}><AppText variant="subtitle">Estado</AppText><SelectionRow radio label="Todos" checked={status==='all'} onPress={()=>setStatus('all')}/><SelectionRow radio label="Activos" checked={status==='active'} onPress={()=>setStatus('active')}/><SelectionRow radio label="Inactivos" checked={status==='inactive'} onPress={()=>setStatus('inactive')}/></FilterDisclosure></SearchFilterBar>
    {canCreate&&<AppButton label="Crear usuario" onPress={()=>{setCreateValues(empty);setCreateErrors({});setCreatePhoto(null);setCreateOpen(true);}}/>}
    <QueryState {...query}/>{query.data&&<><AppText muted>{query.data.total} usuarios</AppText>
      {!query.data.items.length&&<AppText muted>No hay usuarios para esta consulta.</AppText>}
      <View style={{gap:10}}><ResponsiveGrid>{query.data.items.map(user=><AdminPersonRow key={user.id} imageUri={user.profilePhotoUrl} name={`${user.firstName} ${user.lastName}`} role={roleLabel(user.role,user.roleName)} onView={()=>openUserDetails(user.id)}/>)}</ResponsiveGrid></View>
      <CompactPagination page={page} canPrevious={page>1&&!query.loading} canNext={query.data.hasMore&&!query.loading} onPrevious={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)} summary={`${query.data.total} usuarios`}/>
    </>}
    <AppModal size="wide" visible={createOpen||create==='1'&&canCreate} dismissible onClose={()=>{if(!action.loading){setCreateOpen(false);router.setParams({create:undefined});}}}>
      <AppText variant="title">Crear usuario</AppText><AppText muted>Contraseña inicial: empleadoPetCare1234. Comunicásela al empleado por un canal seguro. Al iniciar sesión tendrá que verificar su correo y elegir una contraseña propia.</AppText>
      <AdminFormSection title="Datos de la cuenta" description="Usaremos estos datos para identificar y contactar a la persona.">
        <AppInput label="Nombre" required value={createValues.firstName} error={createErrors.firstName} maxLength={100} onChangeText={value=>changeCreate('firstName',value)}/>
        <AppInput label="Apellido" required value={createValues.lastName} error={createErrors.lastName} maxLength={100} onChangeText={value=>changeCreate('lastName',value)}/>
        <AppInput label="Correo electrónico" required value={createValues.email} error={createErrors.email} maxLength={254} keyboardType="email-address" autoCapitalize="none" onChangeText={value=>changeCreate('email',value)}/>
        <AppInput label="Teléfono (opcional)" value={createValues.phone} error={createErrors.phone} maxLength={40} keyboardType="phone-pad" onChangeText={value=>changeCreate('phone',value)}/>
      </AdminFormSection>
      <AdminFormSection title="Acceso y perfil" description="El rol define los permisos iniciales de la cuenta.">
        <FormNotice error message={createErrors.roleId??null}/>
        {catalog.data?.roles.filter(role=>role.canAssign).map(role=><SelectionRow radio key={role.id} label={roleLabel(role.code,role.name)} checked={createValues.roleId===role.id} onPress={()=>{changeCreate('roleId',role.id);if(!['VETERINARIAN','GROOMER','SECRETARY'].includes(role.code))setCreatePhoto(null);}}/>)}
        {auth.hasPermission('veterinarians.manage')&&<SelectionRow radio checked={false} label="Veterinario o cirujano" hint="Completá la matrícula y la especialidad en su ficha profesional." onPress={openVeterinarianCreation}/>}
        {photoRole&&<ProfilePhotoInput currentUri={null} photo={createPhoto} disabled={action.loading} onSelect={setCreatePhoto} onRemove={()=>setCreatePhoto(null)}/>}
      </AdminFormSection>
      <QueryState {...catalog}/><FormNotice error message={action.error}/>
      <AdminFormActions><AppButton label="Crear cuenta" loading={action.loading} disabled={!createValues.roleId} onPress={createUser}/><AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={()=>{setCreateOpen(false);router.setParams({create:undefined});}}/></AdminFormActions>
    </AppModal>
    <AppModal visible={selectedUserId!==null} dismissible onClose={()=>setSelectedUserId(null)}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}><AppText variant="title">Detalle del usuario</AppText>{auth.hasPermission('users.manage')&&selectedUser&&<Pressable accessibilityRole="button" accessibilityLabel="Editar usuario" onPress={()=>{setSelectedUserId(null);router.push({pathname:'/admin/users/[id]',params:{id:selectedUser.id}});}} style={{padding:10}}><Ionicons name="create-outline" size={22}/></Pressable>}</View>
      {detailLoading&&<AppText muted>Cargando detalle…</AppText>}
      <FormNotice error message={detailError}/>
      {Boolean(detailError)&&Boolean(selectedUserId)&&<AppButton label="Reintentar detalle" variant="secondary" onPress={()=>openUserDetails(selectedUserId!)}/>}
      {selectedUser&&<>
        <View style={{alignItems:'center',gap:10}}><PetImage uri={selectedUser.profilePhotoUrl} size={76}/><AppText variant="subtitle">{selectedUser.firstName} {selectedUser.lastName}</AppText><AppText muted>{roleLabel(selectedUser.role,selectedUser.roleName)}</AppText></View>
        <AppText><AppText variant="caption" muted>Correo electrónico · </AppText>{selectedUser.email}</AppText>
        <AppText><AppText variant="caption" muted>Teléfono · </AppText>{selectedUser.phone||'Sin teléfono'}</AppText>
        <AppText><AppText variant="caption" muted>Estado · </AppText>{selectedUser.isActive?'Activo':'Inactivo'}</AppText>
        <AppText><AppText variant="caption" muted>Correo · </AppText>{selectedUser.emailVerified?'Verificado':'Sin verificar'}</AppText>
        <AppText variant="subtitle">Permisos activos</AppText>
        {selectedUser.permissions.filter(permission=>permission.effective).map(permission=><AppText key={permission.code} muted>• {permission.name}</AppText>)}
        {!selectedUser.permissions.some(permission=>permission.effective)&&<AppText muted>Sin permisos activos.</AppText>}
        {auth.hasRole('SUPER_ADMIN')&&selectedUser.id!==auth.user?.id&&<AppButton variant={selectedUser.isActive?'secondary':'primary'} destructive={selectedUser.isActive} label={selectedUser.isActive?'Desactivar usuario':'Activar usuario'} onPress={()=>setStatusTarget(!selectedUser.isActive)}/>}
      </>}
      <AppButton label="Cerrar" variant="secondary" onPress={()=>setSelectedUserId(null)}/>
    </AppModal>
    <ConfirmModal visible={statusTarget!==null} title={statusTarget?'Activar usuario':'Desactivar usuario'} confirmLabel={statusTarget?'Activar':'Desactivar'} destructive={statusTarget===false} message={statusTarget?'El usuario podrá volver a iniciar sesión.':'El usuario perderá el acceso y sus sesiones dejarán de ser válidas. Sus datos se conservarán.'} onCancel={()=>setStatusTarget(null)} onConfirm={saveUserStatus}/>
  </ScreenContainer>;
}
