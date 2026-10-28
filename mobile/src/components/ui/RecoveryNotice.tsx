// Este archivo se encarga de lo siguiente: Componente visual reutilizable; mantiene una interacción o presentación común en la app.

import { useState } from 'react';
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { AppInput } from '../forms/AppInput';
import { FormNotice } from './FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { requestPasswordReset } from '../../services/auth.service';

// Función RecoveryNotice: concentra la lógica dentro de este módulo.
export function RecoveryNotice({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [email,setEmail]=useState('');
  const [sent,setSent]=useState(false);
  const [validationError,setValidationError]=useState('');
  const action=useAsyncAction();
  // Función submit: agrupa una operación que este módulo puede ejecutar o reutilizar.
const submit=()=>{
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setValidationError('Ingresá un correo electrónico válido.');return;}
    setValidationError('');void action.run(async()=>{await requestPasswordReset(email);setSent(true);});
  };
  // Función close: agrupa una operación que este módulo puede ejecutar o reutilizar.
const close=()=>{setSent(false);setEmail('');setValidationError('');action.clearError();onClose();};
  return <AppModal visible={visible} dismissible onClose={close}>
    <AppText variant="subtitle">¿Olvidaste tu contraseña?</AppText>
    {sent ? <AppText muted>Si hay una cuenta activa asociada a ese correo, te enviaremos un enlace para restablecer la contraseña. Revisá también la carpeta de correo no deseado.</AppText> : <>
      <AppText muted>Ingresá el correo asociado a tu cuenta y te enviaremos un enlace seguro.</AppText>
      <AppInput label="Correo electrónico" keyboardType="email-address" autoComplete="email" autoCapitalize="none" autoCorrect={false} value={email} editable={!action.loading} onChangeText={value=>{setEmail(value);action.clearError();}} onSubmitEditing={submit}/>
      <FormNotice message={validationError||action.error} error />
    </>}
    <AppButton label={sent?'Listo':'Enviar enlace'} loading={action.loading} onPress={sent?close:submit} />
    {!sent&&<AppButton label="Volver al inicio de sesión" variant="secondary" onPress={close} />}
  </AppModal>;
}
