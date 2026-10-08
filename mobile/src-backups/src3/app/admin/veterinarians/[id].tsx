/** Un formulario compartido para crear y editar; catálogos y herencia provienen del backend. */
import { useEffect,useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { View,StyleSheet,Switch } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppInput } from '../../../components/forms/AppInput';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { FormNotice } from '../../../components/ui/FormNotice';
import { SelectionRow } from '../../../components/ui/SelectionRow';
import { ConfirmModal } from '../../../components/ui/ConfirmModal';
import { useAuth } from '../../../hooks/useAuth';
import { useTheme } from '../../../hooks/useTheme';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import { validateIdentityForm } from '../../../utils/auth-validation';
import { friendlyError } from '../../../services/api';
import type { VetCatalog,VetDetail,VetValues } from '../../../types/veterinarian';

const empty:VetValues={firstName:'',lastName:'',email:'',phone:'',licenseNumber:'',isActive:true,specialtyIds:[],overrides:[]};
export default function VeterinarianEditor() {
  const {id}=useLocalSearchParams<{id:string}>();const creating=id==='new';
  const auth=useAuth();const {request}=auth;const {colors}=useTheme();const action=useAsyncAction();const {showToast}=useFeedback();
  const [catalog,setCatalog]=useState<VetCatalog|null>(null);const [detail,setDetail]=useState<VetDetail|null>(null);
  const [values,setValues]=useState<VetValues>(empty);const [errors,setErrors]=useState<Partial<Record<keyof VetValues,string>>>({});
  const [loadError,setLoadError]=useState<string|null>(null);const [retry,setRetry]=useState(0);const [deactivate,setDeactivate]=useState(false);const [review,setReview]=useState(false);
  const canEdit=auth.hasPermission('veterinarians.manage');
  const canEditPermissions=auth.hasPermission('permissions.manage');
  const fill=(vet:VetDetail)=>{setDetail(vet);setValues({firstName:vet.firstName,lastName:vet.lastName,email:vet.email,phone:vet.phone??'',licenseNumber:vet.licenseNumber,isActive:vet.isActive,
    specialtyIds:vet.specialties.map(s=>s.id),overrides:vet.permissions.filter(p=>p.override!==null).map(p=>({code:p.code,allowed:p.override}))});};
  useEffect(()=>{
    let active=true;
    void Promise.all([request<VetCatalog>('/admin/veterinarians/catalog'),creating?Promise.resolve(null):request<VetDetail>(`/admin/veterinarians/${id}`)])
      .then(([options,vet])=>{if(active){setLoadError(null);setCatalog(options);if(vet)fill(vet);}}).catch(err=>{if(active)setLoadError(friendlyError(err));});
    return ()=>{active=false;};
  },[request,id,creating,retry]);
  function change<K extends keyof VetValues>(key:K,value:VetValues[K]) {setValues(current=>({...current,[key]:value}));setErrors(current=>({...current,[key]:undefined}));setReview(false);}
  const togglePermission=(code:string,inherited:boolean)=>{
    const current=values.overrides.find(p=>p.code===code)?.allowed ?? inherited;
    change('overrides',[...values.overrides.filter(p=>p.code!==code),{code,allowed:!current}]);
  };
  const prepare=()=>{
    const identity=validateIdentityForm(values);
    const next:Partial<Record<keyof VetValues,string>>={firstName:identity.firstName,lastName:identity.lastName,email:identity.email,phone:identity.phone};
    if (!values.licenseNumber.trim() || values.licenseNumber.trim().length>80) next.licenseNumber='Ingresá una matrícula de hasta 80 caracteres.';
    if (!values.specialtyIds.length) next.specialtyIds='Seleccioná al menos una especialidad.';
    setErrors(next);if (!Object.values(next).some(Boolean)) setReview(true);
  };
  const save=async()=>{
    if (creating) {
      const result=await auth.request<{veterinarian:VetDetail;delivery:string}>('/admin/veterinarians',{method:'POST',body:values});
      showToast(result.delivery==='sent'?'Veterinario creado. Invitación enviada.':result.delivery==='failed'?'Veterinario creado. Falló el envío; reenviá la invitación.':'Veterinario creado con cuenta inactiva.',result.delivery==='failed'?'info':'success');
      router.replace({pathname:'/admin/veterinarians/[id]',params:{id:result.veterinarian.id}});
    } else {
      const vet=await auth.request<VetDetail>(`/admin/veterinarians/${id}`,{method:'PUT',body:values});fill(vet);setReview(false);
      showToast('Datos y permisos actualizados','success');
    }
  };
  return <ScreenContainer keyboardAvoiding>
    <AppButton label="Volver a Veterinarios" variant="secondary" disabled={action.loading} onPress={()=>router.replace('/admin/veterinarians')} />
    <AppText variant="title">{creating?'Crear veterinario':'Perfil veterinario'}</AppText>
    <FormNotice error message={loadError} />
    {loadError && <AppButton label="Reintentar" onPress={()=>setRetry(retry+1)} />}
    {!catalog && !loadError && <AppText muted>Cargando catálogos…</AppText>}
    {catalog && (!creating || canEdit) && <>
      <AppText variant="subtitle">1. Datos personales</AppText>
      <AppInput label="Nombre" value={values.firstName} error={errors.firstName} editable={canEdit&&!action.loading} onChangeText={v=>change('firstName',v)} />
      <AppInput label="Apellido" value={values.lastName} error={errors.lastName} editable={canEdit&&!action.loading} onChangeText={v=>change('lastName',v)} />
      <AppInput label="Correo electrónico" value={values.email} error={errors.email} keyboardType="email-address" editable={canEdit&&!action.loading} onChangeText={v=>change('email',v)} />
      {!creating && <AppText variant="caption" muted>Cambiar el correo revoca la sesión y exige una nueva invitación para verificarlo y configurar la contraseña.</AppText>}
      <AppInput label="Teléfono" value={values.phone} error={errors.phone} keyboardType="phone-pad" editable={canEdit&&!action.loading} onChangeText={v=>change('phone',v)} />
      <AppText variant="subtitle">2. Datos profesionales</AppText>
      <AppInput label="Matrícula profesional" value={values.licenseNumber} error={errors.licenseNumber} editable={canEdit&&!action.loading} onChangeText={v=>change('licenseNumber',v)} />
      <AppText variant="subtitle">3. Especialidades</AppText>
      <FormNotice error message={errors.specialtyIds??null} />
      {!catalog.specialties.length && <AppText muted>No hay especialidades registradas. Es necesario crear una antes de guardar un veterinario.</AppText>}
      {catalog.specialties.map(s=><SelectionRow key={s.id} label={s.name} checked={values.specialtyIds.includes(s.id)} disabled={!canEdit||action.loading}
        onPress={()=>change('specialtyIds',values.specialtyIds.includes(s.id)?values.specialtyIds.filter(x=>x!==s.id):[...values.specialtyIds,s.id])} />)}
      <AppText variant="subtitle">Cuenta</AppText>
      <AppText muted>Rol Veterinario · asignado por el servidor</AppText>
      <View style={styles.state}><AppText>{values.isActive?'Activa':'Inactiva'}</AppText><Switch accessibilityLabel="Cuenta activa" value={values.isActive} disabled={action.loading||!canEdit}
        onValueChange={value=>{if (!value&&!creating&&detail?.isActive)setDeactivate(true);else change('isActive',value);}} trackColor={{true:colors.primary}} /></View>
      {detail && <><AppText muted>Correo: {detail.emailVerified?'Verificado':'Sin verificar'} · Invitación: {detail.invitationStatus==='accepted'?'Aceptada':detail.invitationStatus==='pending'?'Pendiente':detail.invitationStatus==='failed'?'Falló el envío':'Sin invitación vigente'}</AppText>
        {values.email!==detail.email&&<AppText muted>Guardá el nuevo correo antes de enviar una invitación.</AppText>}
        <AppButton label={detail.emailVerified?'Enviar restablecimiento de contraseña':'Enviar / reenviar invitación'} variant="secondary" loading={action.loading} disabled={!detail.isActive||values.email!==detail.email}
          onPress={()=>void action.run(async()=>{const result=await auth.request<{delivery:string}>(`/admin/veterinarians/${id}/invitation`,{method:'POST'});showToast(result.delivery==='sent'?'Correo enviado':'Falló el envío. Podés reintentar en un minuto.',result.delivery==='sent'?'success':'error');setDetail(await request<VetDetail>(`/admin/veterinarians/${id}`));})} /></>}
      <AppText variant="subtitle">4. Permisos y accesos</AppText>
      <AppText muted>Los permisos se heredan del rol. Un cambio crea una excepción para este profesional.</AppText>
      {[...new Set(catalog.permissions.map(p=>p.module))].map(module=><View key={module} style={styles.section}>
        <AppText variant="subtitle">{catalog.permissions.find(p=>p.module===module)?.moduleName}</AppText>
        {catalog.permissions.filter(p=>p.module===module).map(p=>{
          const override=values.overrides.find(item=>item.code===p.code)?.allowed ?? null;
          return <View key={p.code} style={styles.section}><SelectionRow label={p.name} hint={p.critical?'Reservado a cuentas administrativas':`${override===null?'Heredado del rol':'Personalizado'} · ${p.description}`}
            checked={p.critical?false:override??p.inherited} disabled={p.critical||!canEditPermissions||!auth.hasPermission(p.code)||action.loading} onPress={()=>togglePermission(p.code,p.inherited)} />
            {override!==null && !p.critical && canEditPermissions && auth.hasPermission(p.code) && <AppButton compact label="Restaurar herencia" variant="secondary" disabled={action.loading} onPress={()=>change('overrides',values.overrides.filter(item=>item.code!==p.code))} />}</View>;
        })}
      </View>)}
      <FormNotice error message={action.error} />
      {canEdit && <AppButton label="5. Revisar cambios" disabled={action.loading} onPress={prepare} />}
      {review && <View style={[styles.review,{backgroundColor:colors.surface,borderColor:colors.border}]}>
        <AppText variant="subtitle">Revisar y {creating?'crear':'guardar'}</AppText>
        <AppText>{values.firstName} {values.lastName} · {values.email}</AppText><AppText>Matrícula {values.licenseNumber} · Cuenta {values.isActive?'activa':'inactiva'}</AppText>
        <AppText muted>{catalog.specialties.filter(s=>values.specialtyIds.includes(s.id)).map(s=>s.name).join(' · ')}</AppText>
        <AppText muted>{values.overrides.filter(p=>p.allowed!==null).length} excepciones de permisos. Cada profesional configura su contraseña por correo.</AppText>
        <AppButton label={creating?'Crear veterinario':'Guardar datos y permisos'} loading={action.loading} onPress={()=>void action.run(save)} />
      </View>}
    </>}
    <ConfirmModal visible={deactivate} title="Desactivar veterinario" confirmLabel="Desactivar" destructive
      message={`${detail?.firstName} ${detail?.lastName} dejará de poder acceder a PetCare. Sus registros clínicos anteriores se conservarán.`}
      onCancel={()=>setDeactivate(false)} onConfirm={async()=>{const vet=await auth.request<VetDetail>(`/admin/veterinarians/${id}/status`,{method:'PATCH',body:{isActive:false}});setDetail(vet);change('isActive',false);setDeactivate(false);showToast('Veterinario desactivado','success');}} />
  </ScreenContainer>;
}
const styles=StyleSheet.create({section:{gap:10},state:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},review:{padding:18,borderWidth:1,borderRadius:20,gap:12}});
