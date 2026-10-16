import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { LoginLayout } from '../components/layout/LoginLayout';
import { LoginBrand } from '../components/layout/LoginBrand';
import { AppInput } from '../components/forms/AppInput';
import { AppButton } from '../components/ui/AppButton';
import { AppText } from '../components/ui/AppText';
import { FormNotice } from '../components/ui/FormNotice';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { resetPassword } from '../services/auth.service';

export default function ResetPasswordScreen(){
  const {token}=useLocalSearchParams<{token?:string}>();
  const [password,setPassword]=useState('');
  const [confirm,setConfirm]=useState('');
  const [validationError,setValidationError]=useState('');
  const [done,setDone]=useState(false);
  const action=useAsyncAction();
  const submit=()=>{
    if(!token||!/^[a-f0-9]{64}$/.test(token)){setValidationError('El enlace no es válido. Solicitá uno nuevo desde el inicio de sesión.');return;}
    if([...password].length<8||!/\p{Lu}/u.test(password)||!/\p{Ll}/u.test(password)||!/[0-9]/.test(password)||! /[^\p{L}\p{N}\s]/u.test(password)){setValidationError('Usá al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.');return;}
    if(password!==confirm){setValidationError('Las contraseñas no coinciden.');return;}
    setValidationError('');void action.run(async()=>{await resetPassword(token,password);setDone(true);setPassword('');setConfirm('');});
  };
  return <LoginLayout scrollable>
    <LoginBrand title="Nueva contraseña" subtitle="Elegí una contraseña segura para tu cuenta"/>
    {done?<><AppText muted>Tu contraseña se actualizó. Ya podés iniciar sesión con la nueva contraseña.</AppText><AppButton label="Volver al inicio de sesión" onPress={()=>router.replace('/login')}/></>:<>
      {!!token&&<><AppInput label="Nueva contraseña" password value={password} editable={!action.loading} onChangeText={setPassword}/><AppText variant="caption" muted>8 caracteres, mayúscula, minúscula, número y símbolo.</AppText><AppInput label="Repetir contraseña" password value={confirm} editable={!action.loading} onChangeText={setConfirm}/></>}
      <FormNotice error message={validationError||action.error}/>
      <AppButton label="Guardar contraseña" loading={action.loading} onPress={submit}/>
      <AppButton label="Volver al inicio de sesión" variant="secondary" onPress={()=>router.replace('/login')}/>
    </>}
  </LoginLayout>;
}
