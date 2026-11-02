/**
 * ARCHIVO: RecoveryNotice.tsx
 * UBICACIÓN: mobile/src/components/ui/RecoveryNotice.tsx
 * FUNCIÓN: Modal de solicitud de recuperación de contraseña desde el login.
 * RESPONSABILIDAD: Recoger email, validar entrada y solicitar el envío de instrucciones de recuperación.
 * CONEXIONES: Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AppInput.tsx, mobile/src/components/ui/FormNotice.tsx, mobile/src/hooks/useAsyncAction.ts, mobile/src/services/auth.service.ts Se utiliza desde: mobile/src/app/login.tsx
 * FUNCIONAMIENTO: submit valida formato antes de llamar requestPasswordReset; al cerrar limpia email, estado enviado, validación y error asíncrono.
 * IMPORTANCIA: Mantiene el proceso de recuperación separado del formulario de inicio de sesión.
 */
import { useState } from 'react';
import { AppModal } from './AppModal';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { AppInput } from '../forms/AppInput';
import { FormNotice } from './FormNotice';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { requestPasswordReset } from '../../services/auth.service';

/** Conserva el formulario y sus estados locales mientras el modal está abierto. */
export function RecoveryNotice({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [email,setEmail]=useState('');
  const [sent,setSent]=useState(false);
  const [validationError,setValidationError]=useState('');
  const action=useAsyncAction();
  /** Valida el correo antes de solicitar el enlace; la respuesta no revela si existe la cuenta. */
  const submit=()=>{
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())){setValidationError('Ingresá un correo electrónico válido.');return;}
    setValidationError('');void action.run(async()=>{await requestPasswordReset(email);setSent(true);});
  };
  /** Limpia el borrador y el resultado al cerrar para que la próxima apertura empiece limpia. */
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
