/** Pantalla pública de invitación; el secreto permanece en memoria y nunca se persiste. */
import { useEffect,useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { ScreenContainer } from '../layout/ScreenContainer';
import { AppText } from '../ui/AppText';
import { AppInput } from '../forms/AppInput';
import { AppButton } from '../ui/AppButton';
import { FormNotice } from '../ui/FormNotice';
import { apiRequest } from '../../services/api';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { validatePasswordForm } from '../../utils/auth-validation';
export function ActivationForm({kind}:{kind:'account'|'veterinarian'}) {
  const [token,setToken]=useState('');const [password,setPassword]=useState('');const [confirmPassword,setConfirm]=useState('');
  const [errors,setErrors]=useState<{password?:string;confirmPassword?:string}>({});const action=useAsyncAction();const {showToast}=useFeedback();const [done,setDone]=useState(false);
  useEffect(()=>{
    let active=true;
    const receive=(url:string|null)=>{
      if(!active)return;
      const fragment=Platform.OS==='web'&&typeof window!=='undefined'?window.location.hash:url?.split('#')[1]??'';
      const value=new URLSearchParams(fragment.replace(/^#/, '')).get('token');
      if(value&&/^[a-f0-9]{64}$/.test(value)) {
        setToken(value);
        if(Platform.OS==='web'&&typeof window!=='undefined')window.history.replaceState(window.history.state,'',window.location.pathname);
      }
    };
    void Linking.getInitialURL().then(receive).catch(()=>undefined);
    const subscription=Linking.addEventListener('url',event=>receive(event.url));
    return ()=>{active=false;subscription.remove();};
  },[]);
  return <ScreenContainer keyboardAvoiding>
    <AppText variant="caption" muted>PETCARE · ACTIVACIÓN DE CUENTA</AppText>
    <AppText variant="title">Configurá tu contraseña</AppText>
    <AppText muted>El enlace verifica tu correo. Tu contraseña será privada y la invitación podrá usarse una sola vez.</AppText>
    {!token&&!done&&<FormNotice error message="Abrí el enlace que recibiste por correo. Si venció, solicitá una nueva invitación al administrador." />}
    {!done&&token&&<>
      <AppInput label="Nueva contraseña" password value={password} error={errors.password} editable={!action.loading} onChangeText={setPassword} />
      <AppInput label="Repetir contraseña" password value={confirmPassword} error={errors.confirmPassword} editable={!action.loading} onChangeText={setConfirm} />
      <FormNotice error message={action.error} />
      <AppButton label="Configurar contraseña y verificar correo" loading={action.loading} onPress={()=>{
        const validation=validatePasswordForm({password,confirmPassword});setErrors(validation);if(Object.keys(validation).length)return;
        void action.run(async()=>{await apiRequest(kind==='account'?'/auth/invitations/accept':'/auth/veterinarian-invitations/accept',{method:'POST',body:{token,password}});setToken('');setPassword('');setConfirm('');setDone(true);showToast('Cuenta configurada. Ya podés iniciar sesión.','success');});
      }} />
    </>}
    {done&&<AppText>Contraseña configurada y correo verificado.</AppText>}
    <AppButton label="Ir a Login" variant="secondary" disabled={action.loading} onPress={()=>router.replace('/login')} />
  </ScreenContainer>;
}

