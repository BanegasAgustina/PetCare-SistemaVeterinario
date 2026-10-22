/**
 * Pantalla de detalle de usuario para ADMIN/SUPER_ADMIN con los permisos exigidos.
 * Usa los hooks y servicios autenticados de su módulo (/admin o /clinic según la operación);
 * no debe decidir ownership ni privilegios a partir de parámetros locales.
 */
import { useCallback,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { View,Switch } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/forms/AppInput';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../../../components/forms/ProfilePhotoInput';
import { FormNotice } from '../../../components/ui/FormNotice';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { PetCareCard,PetImage,QueryState } from '../../../components/client/PetCareUI';
import { useAuth } from '../../../hooks/useAuth';
import { useAdmin } from '../../../hooks/useAdmin';
import { useClientQuery } from '../../../hooks/useClientQuery';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { validateIdentityForm } from '../../../utils/auth-validation';
import type { AdminUserDetail } from '../../../types/admin';
import { roleLabel } from '../../../utils/role-label';
import { groupPermissionsByModule } from '../../../utils/admin-permissions';
const empty={firstName:'',lastName:'',email:'',phone:'',roleId:'',isActive:true};
export default function UserEditor() {
  const {id}=useLocalSearchParams<{id:string}>();const creating=id==='new';const auth=useAuth();const api=useAdmin();const action=useAsyncAction();const {showToast}=useFeedback();
  const [values,setValues]=useState(empty);const [errors,setErrors]=useState<Partial<Record<keyof typeof empty,string>>>({});
  const [overrides,setOverrides]=useState<{code:string;allowed:boolean|null}[]>([]);
  const [photo,setPhoto]=useState<PickedProfilePhoto|null>(null);const [removePhoto,setRemovePhoto]=useState(false);
  const [confirm,setConfirm]=useState<'identity'|'permissions'|null>(null);
  function fill(user:AdminUserDetail){setValues({firstName:user.firstName,lastName:user.lastName,email:user.email,phone:user.phone??'',roleId:user.roleId,isActive:user.isActive});setOverrides(user.permissions.filter(p=>p.override!==null).map(p=>({code:p.code,allowed:p.override})));}
  const load=useCallback(async()=>{const catalog=await api.catalog();const user=creating?null:await api.user(id);if(user)fill(user);return {catalog,user};},[api,id,creating]);const query=useClientQuery(load);
  const user=query.data?.user;const self=user?.id===auth.user?.id;const canChangeStatus=auth.hasRole('SUPER_ADMIN');
  const blocked=Boolean(user?.role==='SUPER_ADMIN'&&!auth.hasRole('SUPER_ADMIN'));
  const canPermissions=auth.hasPermission('permissions.manage')&&!self&&!blocked;
  const selectedRole=query.data?.catalog.roles.find(role=>role.id===values.roleId);const photoRole=['VETERINARIAN','GROOMER','SECRETARY'].includes(user?.role??selectedRole?.code??'');
  function change<K extends keyof typeof empty>(key:K,value:(typeof empty)[K]){setValues(v=>({...v,[key]:value}));setErrors(e=>({...e,[key]:undefined}));}
  function prepare(){const validation=validateIdentityForm(values);const next={...validation,...(!values.roleId?{roleId:'Seleccioná un rol.'}:{})};setErrors(next);if(!Object.values(next).some(Boolean))setConfirm('identity');}
  async function save(){
    if(creating){const result=await api.createUser({firstName:values.firstName,lastName:values.lastName,email:values.email,phone:values.phone||null,roleId:values.roleId});setConfirm(null);let photoFailed=false;if(photo){try{await api.updateUserPhoto(result.user.id,{photoBase64:photo.base64});}catch{photoFailed=true;}}showToast(photoFailed?'Cuenta creada; no se pudo guardar la foto. Podés reintentar en el perfil.':'Cuenta creada. Comunicá la contraseña inicial al empleado por un canal seguro; deberá verificar el correo y cambiarla.',photoFailed?'info':'success');router.replace({pathname:'/admin/users/[id]',params:{id:result.user.id}});}
    else {await api.updateUser(id,{firstName:values.firstName,lastName:values.lastName,phone:values.phone||null,isActive:values.isActive,...(user&&values.roleId!==user.roleId?{roleId:values.roleId}:{})});setConfirm(null);let photoFailed=false;if(photo||removePhoto){try{await api.updateUserPhoto(id,photo?{photoBase64:photo.base64}:{removePhoto:true});setPhoto(null);setRemovePhoto(false);}catch{photoFailed=true;}}query.reload();await auth.refreshProfile();showToast(photoFailed?'Datos guardados; no se pudo actualizar la foto. Podés reintentar.':'Usuario actualizado',photoFailed?'info':'success');}
  }
  return <ScreenContainer keyboardAvoiding wide><AppText variant="title">{creating?'Crear usuario':'Usuario'}</AppText><QueryState {...query}/>
    {query.data&&!query.error&&!query.loading&&<>
      {blocked&&<FormNotice message="Un administrador no puede modificar cuentas de administrador principal."/>}
      <PetCareCard><AppInput label="Nombre" value={values.firstName} error={errors.firstName} maxLength={100} editable={!blocked&&!action.loading} onChangeText={v=>change('firstName',v)}/>
        <AppInput label="Apellido" value={values.lastName} error={errors.lastName} maxLength={100} editable={!blocked&&!action.loading} onChangeText={v=>change('lastName',v)}/>
        <AppInput label="Correo electrónico" value={values.email} error={errors.email} maxLength={254} keyboardType="email-address" autoCapitalize="none" editable={creating&&!action.loading} onChangeText={v=>change('email',v)}/>
        <AppInput label="Teléfono (opcional)" value={values.phone} error={errors.phone} maxLength={40} keyboardType="phone-pad" editable={!blocked&&!action.loading} onChangeText={v=>change('phone',v)}/>
        {user&&<AppText muted>Correo {user.emailVerified?'verificado':'sin verificar'}.</AppText>}
      </PetCareCard>
      <PetCareCard><AppText variant="subtitle">Rol</AppText><FormNotice error message={errors.roleId??null}/>
        {!creating&&Boolean(user?.profilePhotoUrl)&&<PetImage uri={user!.profilePhotoUrl!} size={64}/>}
        {query.data.catalog.roles.map(role=><SelectionRow radio key={role.id} label={roleLabel(role.code,role.name)} hint={role.code==='VETERINARIAN'?'Los perfiles profesionales se gestionan desde Veterinarios':!role.canAssign?'Asignación no disponible con tus permisos':undefined} checked={values.roleId===role.id} disabled={blocked||self||user?.role==='VETERINARIAN'||!role.canAssign||action.loading} onPress={()=>{if(!['VETERINARIAN','GROOMER','SECRETARY'].includes(role.code)){setPhoto(null);setRemovePhoto(false);}change('roleId',role.id);}}/>)}
        {photoRole&&<ProfilePhotoInput currentUri={removePhoto?null:user?.profilePhotoUrl??null} photo={photo} disabled={blocked||action.loading} onSelect={value=>{setPhoto(value);setRemovePhoto(false);}} onRemove={()=>{setPhoto(null);setRemovePhoto(true);}}/>}
        {user?.role==='VETERINARIAN'&&<AppButton variant="secondary" label="Ir a Veterinarios" onPress={()=>router.push('/admin/veterinarians')}/>}
        {!creating&&<View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><AppText>Cuenta activa</AppText><Switch accessibilityLabel="Cuenta activa" value={values.isActive} disabled={blocked||self||action.loading||!canChangeStatus} onValueChange={v=>change('isActive',v)}/></View>}
      </PetCareCard>
      {!blocked&&(!creating||auth.hasPermission('roles.manage'))&&<AppButton label={creating?'Crear cuenta':'Revisar y guardar usuario'} disabled={action.loading} onPress={prepare}/>}
      {!creating&&!blocked&&<FormNotice error message={action.error}/>}
      {user&&<PetCareCard><AppText variant="subtitle">Permisos efectivos</AppText><AppText muted>Heredar usa el rol; conceder y negar crean una excepción de este usuario.</AppText>
        {groupPermissionsByModule(query.data.catalog.permissions).map(group=><View key={group.name} style={{gap:12}}><AppText variant="subtitle">{group.name}</AppText>{group.permissions.map(permission=>{const current=user.permissions.find(p=>p.code===permission.code);const override=overrides.find(o=>o.code===permission.code)?.allowed??null;const blockedCritical=permission.critical&&!['ADMIN','SUPER_ADMIN'].includes(user.role);const editable=canPermissions&&permission.canDelegate&&!blockedCritical&&!action.loading;
          return <View key={permission.code} style={{gap:8}}><AppText>{permission.name}</AppText><AppText variant="caption" muted>{permission.description}</AppText><AppText muted>Heredado: {current?.inherited?'sí':'no'} · Efectivo: {current?.effective?'sí':'no'}</AppText>
            <SelectionRow radio label="Heredar del rol" checked={override===null} disabled={!editable} onPress={()=>setOverrides(v=>v.filter(o=>o.code!==permission.code))}/>
            <SelectionRow radio label="Conceder" checked={override===true} disabled={!editable} onPress={()=>setOverrides(v=>[...v.filter(o=>o.code!==permission.code),{code:permission.code,allowed:true}])}/>
            <SelectionRow radio label="Negar" checked={override===false} disabled={!editable} onPress={()=>setOverrides(v=>[...v.filter(o=>o.code!==permission.code),{code:permission.code,allowed:false}])}/>
          </View>;
        })}</View>)}
        {canPermissions&&<AppButton label="Revisar y guardar permisos" disabled={action.loading} onPress={()=>setConfirm('permissions')}/>}
      </PetCareCard>}
    </>}
    <ConfirmModal visible={confirm==='identity'} title={creating?'Crear cuenta real':'Guardar cambios de usuario'} message={creating?'La cuenta se creará con la contraseña inicial empleadoPetCare1234. El empleado tendrá que verificar su correo y cambiarla antes de acceder.':!values.isActive?'La cuenta quedará inactiva y sus sesiones dejarán de ser válidas. Sus registros se conservarán.':'Los cambios de rol revocan las sesiones anteriores y se aplican en el backend.'} destructive={!creating&&!values.isActive} onCancel={()=>setConfirm(null)} onConfirm={save}/>
    <ConfirmModal visible={confirm==='permissions'} title="Cambiar permisos" message="Las excepciones se guardarán en MySQL y afectarán el acceso del usuario en su próxima solicitud." onCancel={()=>setConfirm(null)} onConfirm={async()=>{await api.userPermissions(id,overrides);setConfirm(null);query.reload();showToast('Permisos actualizados','success');}}/>
  </ScreenContainer>;
}
