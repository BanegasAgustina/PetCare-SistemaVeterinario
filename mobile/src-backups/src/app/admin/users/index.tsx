/**
 * Pantalla de usuarios para ADMIN/SUPER_ADMIN con los permisos exigidos.
 * Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación);
 *  no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppText } from '../../../components/ui/AppText';
import { AppInput } from '../../../components/forms/AppInput';
import { AppButton } from '../../../components/ui/AppButton';
import { PetCareCard,PetImage,QueryState } from '../../../components/client/PetCareUI';
import { useAdmin } from '../../../hooks/useAdmin';
import { useAuth } from '../../../hooks/useAuth';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { roleLabel } from '../../../utils/role-label';
import { FilterDisclosure } from '../../../components/ui/FilterDisclosure';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { CompactPagination } from '../../../components/ui/CompactPagination';
import { SearchFilterBar } from '../../../components/ui/SearchFilterBar';
import { AppModal } from '../../../components/ui/AppModal';
import { FormNotice } from '../../../components/ui/FormNotice';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../../../components/forms/ProfilePhotoInput';
import { validateIdentityForm } from '../../../utils/auth-validation';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
const empty={firstName:'',lastName:'',email:'',phone:'',roleId:'',isActive:true};
export default function UsersScreen() {
  const {create}=useLocalSearchParams<{create?:string}>();
  const api=useAdmin();const auth=useAuth();const action=useAsyncAction();const {showToast}=useFeedback();const [search,setSearch]=useState('');const [filter,setFilter]=useState('');const [status,setStatus]=useState('all');const [page,setPage]=useState(1);
  const [createOpen,setCreateOpen]=useState(false);const [createValues,setCreateValues]=useState(empty);const [createErrors,setCreateErrors]=useState<Partial<Record<keyof typeof empty,string>>>({});const [createPhoto,setCreatePhoto]=useState<PickedProfilePhoto|null>(null);
  const load=useCallback(()=>api.users(filter,page,status),[api,filter,page,status]);const query=useClientQuery(load);
  const catalog=useClientQuery(api.catalog);const selectedRole=catalog.data?.roles.find(role=>role.id===createValues.roleId);const photoRole=['VETERINARIAN','GROOMER','SECRETARY'].includes(selectedRole?.code??'');const canCreate=auth.hasPermission('roles.manage');
  function changeCreate<K extends keyof typeof empty>(key:K,value:(typeof empty)[K]){setCreateValues(current=>({...current,[key]:value}));setCreateErrors(current=>({...current,[key]:undefined}));}
  function createUser(){const identity=validateIdentityForm(createValues);const errors={...identity,...(!createValues.roleId?{roleId:'Seleccioná un rol.'}:{})};setCreateErrors(errors);if(Object.values(errors).some(Boolean))return;void action.run(async()=>{const result=await api.createUser({firstName:createValues.firstName,lastName:createValues.lastName,email:createValues.email,phone:createValues.phone||null,roleId:createValues.roleId});let photoFailed=false;if(createPhoto&&photoRole){try{await api.updateUserPhoto(result.user.id,{photoBase64:createPhoto.base64});}catch{photoFailed=true;}}setCreateOpen(false);query.reload();showToast(photoFailed?'Cuenta creada; no se pudo guardar la foto. Podés reintentar en el perfil.':result.delivery==='sent'?'Cuenta creada. Invitación enviada.':'Cuenta creada; no se pudo enviar el correo.',photoFailed||result.delivery!=='sent'?'info':'success');router.replace({pathname:'/admin/users/[id]',params:{id:result.user.id}});});}
  return <ScreenContainer><AppButton variant="secondary" label="Volver a Gestión" onPress={()=>router.replace('/admin')}/><AppText variant="title">Usuarios</AppText>
    <SearchFilterBar><AppInput label="Buscar usuarios" placeholder="Nombre o email" value={search} onChangeText={setSearch} returnKeyType="search" onSubmitEditing={()=>{setPage(1);setFilter(search.trim());}}/><FilterDisclosure fullWidth activeCount={status==='all'?0:1} onApply={()=>setPage(1)} onClear={()=>{setStatus('all');setPage(1);}}><AppText variant="subtitle">Estado</AppText><SelectionRow radio label="Todos" checked={status==='all'} onPress={()=>setStatus('all')}/><SelectionRow radio label="Activos" checked={status==='active'} onPress={()=>setStatus('active')}/><SelectionRow radio label="Inactivos" checked={status==='inactive'} onPress={()=>setStatus('inactive')}/></FilterDisclosure><AppButton compact label="Buscar" disabled={query.loading} onPress={()=>{setPage(1);setFilter(search.trim());}}/></SearchFilterBar>
    {canCreate&&<AppButton label="Crear usuario e invitar" onPress={()=>{setCreateValues(empty);setCreateErrors({});setCreatePhoto(null);setCreateOpen(true);}}/>}
    <QueryState {...query}/>{query.data&&<><AppText muted>{query.data.total} usuarios</AppText>
      {!query.data.items.length&&<AppText muted>No hay usuarios para esta consulta.</AppText>}
      {query.data.items.map(user=><PetCareCard key={user.id}><PetImage uri={user.profilePhotoUrl} size={56}/><AppText variant="subtitle">{user.firstName} {user.lastName}</AppText><AppText>{user.email}</AppText><AppText muted>{roleLabel(user.role,user.roleName)} · {user.isActive?'Activa':'Inactiva'}</AppText><AppButton variant="secondary" label="Ver / Editar" onPress={()=>router.push({pathname:'/admin/users/[id]',params:{id:user.id}})}/></PetCareCard>)}
      <CompactPagination page={page} canPrevious={page>1&&!query.loading} canNext={query.data.hasMore&&!query.loading} onPrevious={()=>setPage(p=>p-1)} onNext={()=>setPage(p=>p+1)} summary={`${query.data.total} usuarios`}/>
    </>}
    <AppModal visible={createOpen||create==='1'&&canCreate} dismissible onClose={()=>{if(!action.loading){setCreateOpen(false);router.setParams({create:undefined});}}}>
      <AppText variant="title">Crear usuario</AppText><AppText muted>La persona recibirá una invitación para verificar el correo y configurar su contraseña.</AppText>
      <AppInput label="Nombre" value={createValues.firstName} error={createErrors.firstName} maxLength={100} onChangeText={value=>changeCreate('firstName',value)}/>
      <AppInput label="Apellido" value={createValues.lastName} error={createErrors.lastName} maxLength={100} onChangeText={value=>changeCreate('lastName',value)}/>
      <AppInput label="Email" value={createValues.email} error={createErrors.email} maxLength={254} keyboardType="email-address" autoCapitalize="none" onChangeText={value=>changeCreate('email',value)}/>
      <AppInput label="Teléfono (opcional)" value={createValues.phone} error={createErrors.phone} maxLength={40} keyboardType="phone-pad" onChangeText={value=>changeCreate('phone',value)}/>
      <AppText variant="subtitle">Rol</AppText><FormNotice error message={createErrors.roleId??null}/>
      {catalog.data?.roles.filter(role=>role.canAssign).map(role=><SelectionRow radio key={role.id} label={roleLabel(role.code,role.name)} checked={createValues.roleId===role.id} onPress={()=>{changeCreate('roleId',role.id);if(!['VETERINARIAN','GROOMER','SECRETARY'].includes(role.code))setCreatePhoto(null);}}/>)}
      {photoRole&&<ProfilePhotoInput currentUri={null} photo={createPhoto} disabled={action.loading} onSelect={setCreatePhoto} onRemove={()=>setCreatePhoto(null)}/>}
      <QueryState {...catalog}/><FormNotice error message={action.error}/>
      <AppButton label="Crear e invitar" loading={action.loading} disabled={!createValues.roleId} onPress={createUser}/>
      <AppButton label="Cancelar" variant="secondary" disabled={action.loading} onPress={()=>setCreateOpen(false)}/>
    </AppModal>
  </ScreenContainer>;
}
