// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

/**
 * Pantalla de usuarios para ADMIN/SUPER_ADMIN con los permisos exigidos.
 * Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación);
 *  no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useEffect,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
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
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { CompactPagination } from '../../../components/ui/CompactPagination';
import { AdminListToolbar } from '../../../components/admin/AdminListToolbar';
import { AdminDataTable } from '../../../components/admin/AdminDataTable';
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
import { AdminPageHeading } from '../../../components/admin/AdminPageHeading';
import { ConfirmNameModal } from '../../../components/admin/ConfirmNameModal';
import { useDebouncedValue } from '../../../hooks/useDebouncedValue';
// Configuración empty: reúne valores o reglas que consume el resto del módulo.
const empty={firstName:'',lastName:'',email:'',phone:'',roleId:'',isActive:true};
// Función UsersScreen: concentra la lógica dentro de este módulo.
export default function UsersScreen() {
  const {width}=useWindowDimensions();
  const desktopTable=Platform.OS==='web'&&width>=1024;
  const {create}=useLocalSearchParams<{create?:string}>();
  const api=useAdmin();const auth=useAuth();const action=useAsyncAction();const {showToast}=useFeedback();const [search,setSearch]=useState('');const [status,setStatus]=useState('all');const [draftStatus,setDraftStatus]=useState('all');const [page,setPage]=useState(1);const filter=useDebouncedValue(search.trim());
  const [createOpen,setCreateOpen]=useState(false);const [createValues,setCreateValues]=useState(empty);const [createErrors,setCreateErrors]=useState<Partial<Record<keyof typeof empty,string>>>({});const [createPhoto,setCreatePhoto]=useState<PickedProfilePhoto|null>(null);
  const load=useCallback(()=>api.users(filter,page,status),[api,filter,page,status]);const query=useClientQuery(load);
  const [selectedUserId,setSelectedUserId]=useState<string|null>(null);const [selectedUser,setSelectedUser]=useState<AdminUserDetail|null>(null);const [detailLoading,setDetailLoading]=useState(false);const [detailError,setDetailError]=useState<string|null>(null);const [statusTarget,setStatusTarget]=useState<boolean|null>(null);const [statusUser,setStatusUser]=useState<{id:string;firstName:string;lastName:string;phone:string|null;isActive:boolean}|null>(null);
  useEffect(()=>{if(!selectedUserId)return;let current=true;void api.user(selectedUserId).then(user=>{if(current)setSelectedUser(user);}).catch(error=>{if(current)setDetailError(friendlyError(error));}).finally(()=>{if(current)setDetailLoading(false);});return()=>{current=false;};},[api,selectedUserId]);
  const catalog=useClientQuery(api.catalog);const selectedRole=catalog.data?.roles.find(role=>role.id===createValues.roleId);const photoRole=['VETERINARIAN','GROOMER'].includes(selectedRole?.code??'');const canCreate=auth.hasPermission('roles.manage');
  // Función openVeterinarianCreation: concentra la lógica dentro de este módulo.
function openVeterinarianCreation(){router.setParams({create:undefined});setCreateOpen(false);router.push({pathname:'/admin/veterinarians',params:{create:'1'}});}
  // Función changeCreate: actualiza o guarda información dentro de este módulo.
function changeCreate<K extends keyof typeof empty>(key:K,value:(typeof empty)[K]){setCreateValues(current=>({...current,[key]:value}));setCreateErrors(current=>({...current,[key]:undefined}));}
  // Función openUserDetails: concentra la lógica dentro de este módulo.
function openUserDetails(id:string){setSelectedUserId(id);setSelectedUser(null);setDetailError(null);setDetailLoading(true);}
  // Función saveUserStatus: actualiza o guarda información dentro de este módulo.
  async function saveUserStatus(){if(!statusUser||statusTarget===null)return;if(!statusTarget&&auth.hasRole('SUPER_ADMIN')){const result=await api.deactivateUser(statusUser.id);if(selectedUser?.id===statusUser.id)setSelectedUser({...selectedUser,isActive:false});setStatusTarget(null);setStatusUser(null);query.reload();showToast(result.alreadyInactive?'La cuenta ya estaba dada de baja.':'Cuenta dada de baja; se conservó el historial.','success');return;}const updated=await api.updateUser(statusUser.id,{firstName:statusUser.firstName,lastName:statusUser.lastName,phone:statusUser.phone,isActive:statusTarget});if(selectedUser?.id===updated.id)setSelectedUser(updated);setStatusTarget(null);setStatusUser(null);query.reload();showToast(statusTarget?'Usuario activado':'Usuario desactivado','success');}
  // Función createUser: crea un registro o inicia una operación dentro de este módulo.
function createUser(){const identity=validateIdentityForm(createValues);const errors={...identity,...(!createValues.roleId?{roleId:'Seleccioná un rol.'}:{})};setCreateErrors(errors);if(Object.values(errors).some(Boolean))return;void action.run(async()=>{const result=await api.createUser({firstName:createValues.firstName,lastName:createValues.lastName,email:createValues.email,phone:createValues.phone||null,roleId:createValues.roleId});let photoFailed=false;if(createPhoto&&photoRole){try{await api.updateUserPhoto(result.user.id,{photoBase64:createPhoto.base64});}catch{photoFailed=true;}}setCreateOpen(false);query.reload();const delivery=result.invitationDelivery==='sent'?'Invitación enviada por correo.': 'La cuenta quedó creada, pero no se pudo enviar el correo; Admin Principal puede reenviar la invitación.';showToast(photoFailed?`${delivery} No se pudo guardar la foto.`:delivery,photoFailed?'info':result.invitationDelivery==='sent'?'success':'info');router.replace({pathname:'/admin/users/[id]',params:{id:result.user.id}});});}
  return <ScreenContainer wide><AdminPageHeading title="Usuarios"/>
    <AdminListToolbar search={<AppInput icon="search-outline" label="Buscar usuarios" placeholder="Nombre o correo electrónico" value={search} onChangeText={value=>{setSearch(value);setPage(1);}} returnKeyType="search" onSubmitEditing={()=>setPage(1)}/>} filters={<><AppText variant="subtitle">Estado</AppText>{[['all','Todos'],['active','Activos'],['inactive','Inactivos']].map(([value,label])=><SelectionRow radio key={value} label={label} checked={draftStatus===value} onPress={()=>setDraftStatus(value)}/>)}</>} filterCount={status==='all'?0:1} onFilterOpen={()=>setDraftStatus(status)} onFilterCancel={()=>setDraftStatus(status)} onApply={()=>{setStatus(draftStatus);setPage(1);}} onClear={()=>{setStatus('all');setDraftStatus('all');setPage(1);}} actions={canCreate?<AppButton compact label="Crear usuario" onPress={()=>{setCreateValues(empty);setCreateErrors({});setCreatePhoto(null);setCreateOpen(true);}}/>:undefined}/>
    
<QueryState {...query}/>{query.data&&<><AppText muted>{query.data.total} usuarios</AppText>
      {!query.data.items.length&&<AppText muted>No hay usuarios para esta consulta.</AppText>}
      {desktopTable?<AdminDataTable rows={query.data.items} rowKey={user=>user.id} columns={[
        {key:'user',label:'Usuario',flex:1.2,minWidth:210,render:user=><View style={{flexDirection:'row',alignItems:'center',gap:10}}><PetImage uri={user.profilePhotoUrl} size={38}/><View style={{minWidth:0,flex:1}}><AppText numberOfLines={1} style={{fontWeight:'700'}}>{user.firstName} {user.lastName}</AppText><AppText variant="caption" muted numberOfLines={1}>{user.email}</AppText></View></View>},
        {key:'role',label:'Rol',flex:.8,minWidth:130,render:user=><AppText>{roleLabel(user.role,user.roleName)}</AppText>},
        {key:'status',label:'Estado',flex:.6,minWidth:90,render:user=><AppText variant="caption" muted>{user.isActive?'Activo':'Inactivo'}</AppText>},
        {key:'actions',label:'Acciones',flex:.8,minWidth:154,align:'right',render:user=><View style={{flexDirection:'row',alignItems:'center',justifyContent:'flex-end',gap:6}}><AppButton compact variant="secondary" label="Ver ficha" onPress={()=>openUserDetails(user.id)}/>{(auth.hasRole('SUPER_ADMIN')?auth.hasPermission('users.manage')&&user.id!==auth.user?.id:auth.hasPermission('users.manage')&&user.isActive&&user.id!==auth.user?.id&&user.role!=='SUPER_ADMIN')&&<Pressable accessibilityRole="button" accessibilityLabel={`Dar de baja usuario ${user.firstName} ${user.lastName}`} onPress={()=>{setStatusUser(user);setStatusTarget(false);}} style={{padding:10}}><Ionicons name="trash-outline" size={19} color="#b42318"/></Pressable>}</View>},
      ]}/>:<View style={{gap:10}}><ResponsiveGrid>{query.data.items.map(user=><View key={user.id} style={{flexDirection:'row',alignItems:'center',gap:8}}><View style={{flex:1,minWidth:0}}><AdminPersonRow imageUri={user.profilePhotoUrl} name={`${user.firstName} ${user.lastName}`} role={roleLabel(user.role,user.roleName)} status={user.isActive?'Activo':'Inactivo'} onView={()=>openUserDetails(user.id)}/></View>{(auth.hasRole('SUPER_ADMIN')?auth.hasPermission('users.manage')&&user.id!==auth.user?.id:auth.hasPermission('users.manage')&&user.isActive&&user.id!==auth.user?.id&&user.role!=='SUPER_ADMIN')&&<Pressable accessibilityRole="button" accessibilityLabel={`Dar de baja usuario ${user.firstName} ${user.lastName}`} onPress={()=>{setStatusUser(user);setStatusTarget(false);}} style={{minWidth:44,minHeight:44,alignItems:'center',justifyContent:'center'}}><Ionicons name="trash-outline" size={19} color="#b42318"/></Pressable>}</View>)}</ResponsiveGrid></View>}
      <CompactPagination page={page} canPrevious={page>1&&!query.loading} canNext={query.data.hasMore&&!query.loading} onPrevious={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)} summary={`${query.data.total} usuarios`}/>
    </>}
    <AppModal size="wide" visible={createOpen||create==='1'&&canCreate} dismissible onClose={()=>{if(!action.loading){setCreateOpen(false);router.setParams({create:undefined});}}}>
      <AppText variant="title">Crear usuario</AppText><AppText muted>Enviaremos una invitación al correo indicado. La persona configurará su contraseña desde un enlace de un solo uso, válido durante 24 horas.</AppText>
      
<AdminFormSection title="Datos de la cuenta" description="Usaremos estos datos para identificar y contactar a la persona.">
        <AppInput label="Nombre" required value={createValues.firstName} error={createErrors.firstName} maxLength={100} onChangeText={value=>changeCreate('firstName',value)}/>
        <AppInput label="Apellido" required value={createValues.lastName} error={createErrors.lastName} maxLength={100} onChangeText={value=>changeCreate('lastName',value)}/>
        <AppInput label="Correo electrónico" required value={createValues.email} error={createErrors.email} maxLength={254} keyboardType="email-address" autoCapitalize="none" onChangeText={value=>changeCreate('email',value)}/>
        <AppInput label="Teléfono (opcional)" value={createValues.phone} error={createErrors.phone} maxLength={40} keyboardType="phone-pad" onChangeText={value=>changeCreate('phone',value)}/>
      </AdminFormSection>
      
<AdminFormSection title="Acceso y perfil" description="El rol define los permisos iniciales de la cuenta.">
        <FormNotice error message={createErrors.roleId??null}/>
        {catalog.data?.roles.filter(role=>role.canAssign).map(role=><SelectionRow radio key={role.id} label={roleLabel(role.code,role.name)} checked={createValues.roleId===role.id} onPress={()=>{changeCreate('roleId',role.id);if(!['VETERINARIAN','GROOMER'].includes(role.code))setCreatePhoto(null);}}/>)}
        {auth.hasPermission('veterinarians.manage')&&<SelectionRow radio checked={false} label="Veterinario o cirujano" hint="Completá la matrícula y la especialidad en su ficha profesional." onPress={openVeterinarianCreation}/>}
        {photoRole&&<ProfilePhotoInput currentUri={null} photo={createPhoto} disabled={action.loading} onSelect={setCreatePhoto} onRemove={()=>setCreatePhoto(null)}/>}
      </AdminFormSection>
      
<QueryState {...catalog}/><FormNotice error message={action.error}/>
      
<AdminFormActions><AppButton label="Crear usuario y enviar invitación" loading={action.loading} disabled={!createValues.roleId} onPress={createUser}/><AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={()=>{setCreateOpen(false);router.setParams({create:undefined});}}/></AdminFormActions>
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
        {auth.hasPermission('users.manage')&&selectedUser.id!==auth.user?.id&&(selectedUser.role!=='SUPER_ADMIN'||auth.hasRole('SUPER_ADMIN'))&&<AppButton variant={selectedUser.isActive?'secondary':'primary'} destructive={selectedUser.isActive} label={selectedUser.isActive?'Desactivar usuario':'Activar usuario'} onPress={()=>{setStatusUser(selectedUser);setStatusTarget(!selectedUser.isActive);}}/>}
      </>}
      <AppButton label="Cerrar" variant="secondary" onPress={()=>setSelectedUserId(null)}/>
    </AppModal>
    {statusTarget===false&&statusUser?<ConfirmNameModal visible title="Dar de baja cuenta" confirmLabel={statusUser.isActive?'Dar de baja':'Confirmar baja'} expectedName={`${statusUser.firstName} ${statusUser.lastName}`} identityHint={`Cuenta ID ${statusUser.id}. Se conservarán el historial clínico, las compras y los registros asociados.`} message={statusUser.isActive?'Se bloqueará el acceso y se revocarán las sesiones de esta cuenta.': 'Esta cuenta ya está inactiva. Confirmá para mantenerla dada de baja; su historial se conserva.'} onCancel={()=>{setStatusTarget(null);setStatusUser(null);}} onConfirm={saveUserStatus}/>:<ConfirmModal visible={statusTarget===true} title="Activar usuario" confirmLabel="Activar" message="El usuario podrá volver a iniciar sesión." onCancel={()=>{setStatusTarget(null);setStatusUser(null);}} onConfirm={saveUserStatus}/>}
  </ScreenContainer>;
}
