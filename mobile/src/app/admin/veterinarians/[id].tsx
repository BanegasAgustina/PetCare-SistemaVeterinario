/** Un formulario compartido para crear y editar; catálogos y herencia provienen del backend. */
import { useEffect,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { View,StyleSheet,Switch } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppInput } from '../../../components/forms/AppInput';
import { ProfilePhotoInput,type PickedProfilePhoto } from '../../../components/forms/ProfilePhotoInput';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { FormNotice } from '../../../components/ui/FormNotice';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { AdminFormActions, AdminFormField, AdminFormSection } from '../../../components/admin/AdminFormLayout';
import { softSurfaceShadow } from '../../../constants/surface';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { validateIdentityForm } from '../../../utils/auth-validation';
import { friendlyError } from '../../../services/api';
import type { VetCatalog,VetDetail,VetValues } from '../../../types/veterinarian';

const empty:VetValues={firstName:'',lastName:'',email:'',phone:'',licenseNumber:'',isActive:true,specialtyIds:[]};
export default function VeterinarianEditor() {
  const {id}=useLocalSearchParams<{id:string}>();const creating=id==='new';
  const auth=useAuth();const {request}=auth;const {colors}=useTheme();const action=useAsyncAction();const {showToast}=useFeedback();
  const [catalog,setCatalog]=useState<VetCatalog|null>(null);const [detail,setDetail]=useState<VetDetail|null>(null);
  const [values,setValues]=useState<VetValues>(empty);const [errors,setErrors]=useState<Partial<Record<keyof VetValues,string>>>({});
  const [loadError,setLoadError]=useState<string|null>(null);const [retry,setRetry]=useState(0);const [deactivate,setDeactivate]=useState(false);const [review,setReview]=useState(false);
  const [photo,setPhoto]=useState<PickedProfilePhoto|null>(null);const [removePhoto,setRemovePhoto]=useState(false);
  const canEdit=auth.hasPermission('veterinarians.manage');
  const canChangeStatus=auth.hasRole('SUPER_ADMIN');
  const fill=(vet:VetDetail)=>{setDetail(vet);setValues({firstName:vet.firstName,lastName:vet.lastName,email:vet.email,phone:vet.phone??'',licenseNumber:vet.licenseNumber,isActive:vet.isActive,
    specialtyIds:vet.specialties.map(s=>s.id)});};
  useEffect(()=>{
    let active=true;
    void Promise.all([request<VetCatalog>('/admin/veterinarians/catalog',{method:'POST',body:{}}),creating?Promise.resolve(null):request<VetDetail>(`/admin/veterinarians/${id}`,{method:'POST',body:{}})])
      .then(([options,vet])=>{if(active){setLoadError(null);setCatalog(options);if(vet)fill(vet);}}).catch(err=>{if(active)setLoadError(friendlyError(err));});
    return ()=>{active=false;};
  },[request,id,creating,retry]);
  function change<K extends keyof VetValues>(key:K,value:VetValues[K]) {setValues(current=>({...current,[key]:value}));setErrors(current=>({...current,[key]:undefined}));setReview(false);}
  const prepare=()=>{
    const identity=validateIdentityForm(values);
    const next:Partial<Record<keyof VetValues,string>>={firstName:identity.firstName,lastName:identity.lastName,email:identity.email,phone:identity.phone};
    if (!values.licenseNumber.trim() || values.licenseNumber.trim().length>80) next.licenseNumber='Ingresá una matrícula de hasta 80 caracteres.';
    if (!values.specialtyIds.length) next.specialtyIds='Seleccioná al menos una especialidad.';
    setErrors(next);if (!Object.values(next).some(Boolean)) setReview(true);
  };
  const save=async()=>{
    if (creating) {
      const result=await auth.request<{veterinarian:VetDetail;invitationDelivery:'sent'|'failed'}>('/admin/veterinarians',{method:'POST',body:values});
      const created=result.veterinarian;let photoFailed=false;
      if(photo){try{await auth.request<VetDetail>(`/admin/veterinarians/${created.id}/photo`,{method:'PUT',body:{photoBase64:photo.base64}});}catch{photoFailed=true;}}
      const delivery=result.invitationDelivery==='sent'?'Invitación enviada por correo.':'El veterinario quedó creado, pero no se pudo enviar el correo; Admin Principal puede reenviar la invitación.';
      showToast(photoFailed?`${delivery} No se pudo guardar la foto.`:delivery,photoFailed?'info':result.invitationDelivery==='sent'?'success':'info');
      router.replace({pathname:'/admin/veterinarians/[id]',params:{id:created.id}});
    } else {
      let vet=await auth.request<VetDetail>(`/admin/veterinarians/${id}`,{method:'PUT',body:values});
      if(photo||removePhoto){try{vet=await auth.request<VetDetail>(`/admin/veterinarians/${id}/photo`,{method:'PUT',body:photo?{photoBase64:photo.base64}:{removePhoto:true}});setPhoto(null);setRemovePhoto(false);}catch{fill(vet);setReview(false);showToast('Los datos se guardaron; no se pudo actualizar la foto. Podés reintentar desde este perfil.','error');return;}}
      fill(vet);setReview(false);
      showToast('Datos y permisos actualizados','success');
    }
  };
  return <ScreenContainer keyboardAvoiding wide>
    <AppText variant="title">{creating?'Crear veterinario':'Perfil veterinario'}</AppText>
    <FormNotice error message={loadError} />
    {Boolean(loadError) && <AppButton label="Reintentar" onPress={()=>setRetry(retry+1)} />}
    {!catalog && !loadError && <AppText muted>Cargando catálogos…</AppText>}
    {catalog && (!creating || canEdit) && <>
      <AdminFormSection title="1. Datos personales" description="Información de contacto y perfil profesional." columns={2}>
        <AdminFormField fullWidth><ProfilePhotoInput currentUri={removePhoto?null:detail?.profilePhotoUrl??null} photo={photo} disabled={!canEdit||action.loading} onSelect={value=>{setPhoto(value);setRemovePhoto(false);setReview(false);}} onRemove={()=>{setPhoto(null);setRemovePhoto(true);setReview(false);}}/></AdminFormField>
        <AdminFormField><AppInput label="Nombre" value={values.firstName} error={errors.firstName} editable={canEdit&&!action.loading} onChangeText={v=>change('firstName',v)} /></AdminFormField>
        <AdminFormField><AppInput label="Apellido" value={values.lastName} error={errors.lastName} editable={canEdit&&!action.loading} onChangeText={v=>change('lastName',v)} /></AdminFormField>
        <AdminFormField><AppInput label="Correo electrónico" value={values.email} error={errors.email} keyboardType="email-address" editable={canEdit&&!action.loading} onChangeText={v=>change('email',v)} /></AdminFormField>
        <AdminFormField><AppInput label="Teléfono" value={values.phone} error={errors.phone} keyboardType="phone-pad" editable={canEdit&&!action.loading} onChangeText={v=>change('phone',v)} /></AdminFormField>
        {!creating && <AdminFormField fullWidth><AppText variant="caption" muted>Cambiar el correo revoca la sesión y exige verificar el nuevo correo al iniciar sesión.</AppText></AdminFormField>}
      </AdminFormSection>
      <AdminFormSection title="2. Datos profesionales" description="La matrícula identifica al profesional en la clínica.">
        <AppInput label="Matrícula profesional" value={values.licenseNumber} error={errors.licenseNumber} editable={canEdit&&!action.loading} onChangeText={v=>change('licenseNumber',v)} />
      </AdminFormSection>
      <AdminFormSection title="3. Especialidades" description="Las especialidades habilitan servicios clínicos compatibles.">
      <FormNotice error message={errors.specialtyIds??null} />
      {!catalog.specialties.length && <View style={styles.section}><AppText muted>No hay especialidades activas. Se necesita al menos una para completar el perfil veterinario y validar los servicios clínicos que puede brindar.</AppText>{auth.hasPermission('specialties.manage')&&<AppButton compact variant="secondary" label="Administrar especialidades" onPress={()=>router.push('/admin/veterinarians/specialties')}/>}</View>}
      {catalog.specialties.map(s=><SelectionRow key={s.id} label={s.name} checked={values.specialtyIds.includes(s.id)} disabled={!canEdit||action.loading}
        onPress={()=>change('specialtyIds',values.specialtyIds.includes(s.id)?values.specialtyIds.filter(x=>x!==s.id):[...values.specialtyIds,s.id])} />)}
      </AdminFormSection>
      <AdminFormSection title="Cuenta" description="El rol se asigna automáticamente como Veterinario.">
      <AppText muted>Rol Veterinario · asignado automáticamente</AppText>
      {!creating&&<View style={styles.state}><AppText>{values.isActive?'Activa':'Inactiva'}</AppText><Switch accessibilityLabel="Cuenta activa" value={values.isActive} disabled={action.loading||!canEdit||!canChangeStatus||!detail?.emailVerified&&!values.isActive}
        onValueChange={value=>{if (!value&&detail?.isActive)setDeactivate(true);else change('isActive',value);}} trackColor={{true:colors.primary}} /></View>}
      {!creating&&detail&&!detail.emailVerified&&!detail.isActive&&<AppText variant="caption" muted>La cuenta se activa cuando el veterinario verifica su correo desde la invitación.</AppText>}
      {creating&&<AppText muted>La cuenta quedará pendiente hasta que el veterinario active la invitación recibida por correo.</AppText>}
      {detail && <AppText muted>Correo: {detail.emailVerified?'Verificado':'Sin verificar'}</AppText>}
      </AdminFormSection>
      <FormNotice error message={action.error} />
        {canEdit && <AdminFormActions><AppButton label="4. Revisar cambios" disabled={action.loading} onPress={prepare} /></AdminFormActions>}
      {review && <View style={[styles.review,softSurfaceShadow(colors.primary),{backgroundColor:colors.surface,borderColor:colors.border}]}>
        <AppText variant="subtitle">Revisar y {creating?'crear':'guardar'}</AppText>
        <AppText>{values.firstName} {values.lastName} · {values.email}</AppText><AppText>Matrícula {values.licenseNumber} · Cuenta {creating?'pendiente de activación':values.isActive?'activa':'inactiva'}</AppText>
        <AppText muted>{catalog.specialties.filter(s=>values.specialtyIds.includes(s.id)).map(s=>s.name).join(' · ')}</AppText>
        <AppText muted>{creating?'Se enviará una invitación de un solo uso, válida durante 24 horas. El veterinario configurará su contraseña para verificar el correo.':'Los cambios de cuenta se aplican al guardar.'}</AppText>
        <AdminFormActions><AppButton label={creating?'Crear veterinario':'Guardar datos'} loading={action.loading} onPress={()=>void action.run(save)} /></AdminFormActions>
      </View>}
    </>}
    <ConfirmModal visible={deactivate} title="Desactivar veterinario" confirmLabel="Desactivar" destructive
      message={`${detail?.firstName} ${detail?.lastName} dejará de poder acceder a PetCare. Sus registros clínicos anteriores se conservarán.`}
      onCancel={()=>setDeactivate(false)} onConfirm={async()=>{const vet=await auth.request<VetDetail>(`/admin/veterinarians/${id}/status`,{method:'PATCH',body:{isActive:false}});setDetail(vet);change('isActive',false);setDeactivate(false);showToast('Veterinario desactivado','success');}} />
  </ScreenContainer>;
}
const styles=StyleSheet.create({section:{gap:10},state:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},review:{padding:18,borderWidth:1,borderRadius:20,gap:12}});
