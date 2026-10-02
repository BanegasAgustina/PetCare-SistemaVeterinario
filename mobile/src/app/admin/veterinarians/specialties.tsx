import { useCallback,useEffect,useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { ScreenContainer } from '../../../components/layout/ScreenContainer';
import { AppText } from '../../../components/ui/AppText';
import { AppButton } from '../../../components/ui/AppButton';
import { AppInput } from '../../../components/forms/AppInput';
import { FormNotice } from '../../../components/ui/FormNotice';
import { useAuth } from '../../../hooks/useAuth';
import { useAsyncAction } from '../../../hooks/useAsyncAction';
import { useFeedback } from '../../../contexts/FeedbackContext';
import type { Specialty } from '../../../types/veterinarian';
export default function SpecialtiesScreen() {
  const auth=useAuth();const {request}=auth;const action=useAsyncAction();const {run}=action;const {showToast}=useFeedback();
  const [items,setItems]=useState<Specialty[]|null>(null);const [name,setName]=useState('');const [editing,setEditing]=useState<string|null>(null);const [error,setError]=useState<string|null>(null);
  const load=useCallback(async()=>{
    setItems(null);
    setItems(await request<Specialty[]>('/admin/specialties'));
  },[request]);
  useEffect(()=>{void run(load);},[run,load]);
  return <ScreenContainer keyboardAvoiding>
    <AppButton label="Volver a Veterinarios" variant="secondary" onPress={()=>router.replace('/admin/veterinarians')} />
    <AppText variant="title">Especialidades</AppText>
    <FormNotice error message={action.error} />
    {!auth.user?.permissions?.includes('specialties.manage')?<AppText>No tenés permiso para gestionar especialidades.</AppText>:<>
      <AppInput label={editing?'Editar especialidad':'Nueva especialidad'} value={name} error={error??undefined} editable={!action.loading} onChangeText={v=>{setName(v);setError(null);}} />
      <AppButton label={editing?'Guardar nombre':'Crear especialidad'} loading={action.loading} onPress={()=>{
        if (!name.trim()||name.trim().length>100) {setError('Ingresá un nombre de hasta 100 caracteres.');return;}
        void action.run(async()=>{await auth.request(editing?`/admin/specialties/${editing}`:'/admin/specialties',{method:editing?'PUT':'POST',body:{name}});setName('');setEditing(null);await load();showToast('Especialidad guardada','success');});
      }} />
      {editing&&<AppButton label="Cancelar edición" variant="secondary" onPress={()=>{setEditing(null);setName('');}} />}
      <AppButton label="Actualizar catálogo" variant="secondary" loading={action.loading} onPress={()=>void action.run(load)} />
      {action.loading && items===null && <AppText muted>Consultando especialidades…</AppText>}
      {items!==null && !items.length && <AppText muted>No hay especialidades registradas. Podés crear una desde este formulario.</AppText>}
      {items?.map(item=><View key={item.id} style={{gap:10}}><AppText>{item.name}</AppText><AppButton label={`Editar ${item.name}`} variant="secondary" disabled={action.loading} onPress={()=>{setEditing(item.id);setName(item.name);}} /></View>)}
    </>}
  </ScreenContainer>;
}
