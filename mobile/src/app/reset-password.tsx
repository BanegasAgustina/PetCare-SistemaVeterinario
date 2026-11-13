/**
 * ARCHIVO: reset-password.tsx
 * UBICACIÓN: mobile/src/app/reset-password.tsx
 * FUNCIÓN: Pantalla para elegir una contraseña nueva desde un enlace de recuperación.
 * RESPONSABILIDAD: Normaliza token de URL/deep link, valida formato, controla campos y consume la prueba por medio del servicio de autenticación.
 * CONEXIONES: Importa: mobile/src/components/layout/LoginLayout.tsx, mobile/src/components/layout/LoginBrand.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts y 1 más Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Correo de recuperación → Linking/Expo Router → reset-password → auth.service/API → backend consume token.
 * IMPORTANCIA: Completa la recuperación sin guardar ni reutilizar en frontend la prueba una vez aceptada.
 */
import { router } from 'expo-router';
import { useEffect,useState } from 'react';
import { Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { LoginLayout } from '../components/layout/LoginLayout';
import { LoginBrand } from '../components/layout/LoginBrand';
import { AppInput } from '../components/forms/AppInput';
import { AppButton } from '../components/ui/AppButton';
import { AppText } from '../components/ui/AppText';
import { FormNotice } from '../components/ui/FormNotice';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { resetPassword } from '../services/auth.service';
import { isValidPasswordResetToken, normalizePasswordResetToken } from '../utils/password-reset-token';

/** Lee token de recuperación de URL, gestiona formulario y mensajes y realiza el cambio seguro. */
export default function ResetPasswordScreen(){
  const [token,setToken]=useState('');
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [validationError,setValidationError]=useState('');
  const [done,setDone]=useState(false);
  const action=useAsyncAction();
  useEffect(()=>{
    let active=true;
    /** Lee el token de restablecimiento desde el enlace entrante y actualiza el estado del formulario. */
    const receive=(incoming:string|null)=>{
      if(!active)return;
      const fragment=Platform.OS==='web'&&typeof window!=='undefined'?window.location.hash:incoming?.split('#')[1]??'';
      const rawToken=new URLSearchParams(fragment.replace(/^#/,'')).get('token');
      const normalized=normalizePasswordResetToken(rawToken??undefined);
      setToken(normalized);
      if(normalized&&Platform.OS==='web'&&typeof window!=='undefined')window.history.replaceState(window.history.state,'',window.location.pathname);
    };
    void Linking.getInitialURL().then(receive).catch(()=>undefined);
    const subscription=Linking.addEventListener('url',event=>receive(event.url));
    return ()=>{active=false;subscription.remove();};
  },[]);
  /** Valida el token y las reglas de contraseña antes de confirmar el restablecimiento. */
const submit=()=>{
    if(!isValidPasswordResetToken(token)){setValidationError('El enlace no es válido. Solicitá uno nuevo desde el inicio de sesión.');return;}
    if([...password].length<8||!/\p{Lu}/u.test(password)||!/\p{Ll}/u.test(password)||!/\d/.test(password)||!/[^\p{L}\p{N}\s]/u.test(password)){setValidationError('Usá al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.');return;}
    if(password!==confirm){setValidationError('Las contraseñas no coinciden.');return;}
    setValidationError('');void action.run(async()=>{await resetPassword(token,password);setDone(true);setPassword('');setConfirm('');});
  };
  return <LoginLayout scrollable petDecorations>
    <LoginBrand title="Nueva contraseña" subtitle="Elegí una contraseña segura para tu cuenta"/>
    {done?<><AppText muted>Tu contraseña se actualizó. Ya podés iniciar sesión con la nueva contraseña.</AppText><AppButton label="Volver al inicio de sesión" onPress={()=>router.replace('/login')}/></>:<>
      {!!token&&<><AppInput label="Nueva contraseña" password value={password} editable={!action.loading} onChangeText={setPassword}/><AppText variant="caption" muted>8 caracteres, mayúscula, minúscula, número y símbolo.</AppText><AppInput label="Repetir contraseña" password value={confirm} editable={!action.loading} onChangeText={setConfirm}/></>}
      <FormNotice error message={validationError||action.error}/>
      <AppButton label="Guardar contraseña" loading={action.loading} onPress={submit}/>
      <AppButton label="Volver al inicio de sesión" variant="secondary" onPress={()=>router.replace('/login')}/>
    </>}
  </LoginLayout>;
}
