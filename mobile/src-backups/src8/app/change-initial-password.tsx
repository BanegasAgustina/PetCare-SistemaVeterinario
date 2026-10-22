/** Cambio obligatorio antes de que una cuenta de empleado pueda acceder a la aplicación. */
import { useState } from 'react';
import { router,useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { AppInput } from '../components/forms/AppInput';
import { AppButton } from '../components/ui/AppButton';
import { FormNotice } from '../components/ui/FormNotice';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { changeInitialPassword } from '../services/auth.service';
import { ApiError } from '../services/api';

export default function ChangeInitialPasswordScreen(){
  const {email:emailParam}=useLocalSearchParams<{email?:string}>();const [email,setEmail]=useState(emailParam??'');const [currentPassword,setCurrentPassword]=useState('');const [password,setPassword]=useState('');const [confirmation,setConfirmation]=useState('');const [message,setMessage]=useState<string|null>(null);const action=useAsyncAction();
  async function submit(){setMessage(null);if(password!==confirmation){setMessage('Las contraseñas nuevas no coinciden.');return;}if(password===currentPassword){setMessage('Elegí una contraseña distinta a la inicial.');return;}await action.run(async()=>{try{await changeInitialPassword(email,currentPassword,password);setMessage('Contraseña actualizada. Ya podés iniciar sesión con tu nueva contraseña.');}catch(error){if(error instanceof ApiError&&error.code==='PASSWORD_CHANGE_NOT_REQUIRED'){router.replace('/login');return;}throw error;}});}
  return <ScreenContainer keyboardAvoiding><AppText variant="title">Cambiá tu contraseña</AppText><AppText muted>Verificaste tu correo. Para proteger tu cuenta, elegí una contraseña propia antes de continuar.</AppText>
    <AppInput label="Correo electrónico" value={email} keyboardType="email-address" autoCapitalize="none" editable={!emailParam} onChangeText={setEmail}/>
    <AppInput label="Contraseña inicial" value={currentPassword} password autoComplete="current-password" onChangeText={setCurrentPassword}/>
    <AppInput label="Nueva contraseña" value={password} password autoComplete="new-password" onChangeText={setPassword}/>
    <AppText variant="caption" muted>Usá al menos 8 caracteres, una mayúscula, una minúscula, un número y un símbolo.</AppText>
    <AppInput label="Repetí la nueva contraseña" value={confirmation} password autoComplete="new-password" onChangeText={setConfirmation}/>
    <FormNotice message={action.error} error/><FormNotice message={message}/>
    {message?<AppButton label="Ir a iniciar sesión" onPress={()=>router.replace('/login')}/>:<AppButton label="Guardar contraseña" loading={action.loading} onPress={()=>void submit()}/>}
  </ScreenContainer>;
}
