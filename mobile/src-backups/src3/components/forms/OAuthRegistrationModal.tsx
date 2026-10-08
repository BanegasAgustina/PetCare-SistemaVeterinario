/** Completa una identidad OAuth nueva con datos reales; reutiliza verificación de email del AuthContext. */
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AuthForm,type AuthField } from './AuthForm';
import { useAuth } from '../../hooks/useAuth';
import { validateRegisterForm } from '../../utils/auth-validation';
import type { RegisterValues } from '../../types/auth';
const fields:AuthField<RegisterValues>[]=[
  {key:'firstName',label:'Nombre',inputProps:{autoCapitalize:'words',maxLength:100}},
  {key:'lastName',label:'Apellido',inputProps:{autoCapitalize:'words',maxLength:100}},
  {key:'email',label:'Correo electrónico',inputProps:{keyboardType:'email-address',autoCapitalize:'none',autoCorrect:false,maxLength:254}},
  {key:'phone',label:'Teléfono (opcional)',inputProps:{keyboardType:'phone-pad',maxLength:40}},
  {key:'password',label:'Contraseña de PetCare',password:true,hint:'8 caracteres, mayúscula, minúscula, número y símbolo.'},
  {key:'confirmPassword',label:'Repetir contraseña',password:true},
];
export function OAuthRegistrationModal(){
  const auth=useAuth();if(!auth.oauthPending)return null;
  return <AppModal visible><AppText variant="subtitle">Completá tu cuenta</AppText><AppText muted>Verificaremos tu correo con un código. Si ya tenés una cuenta, cancelá e iniciá sesión con tu contraseña para vincular este proveedor.</AppText>
    <AuthForm fields={fields} initialValues={{firstName:'',lastName:'',email:auth.oauthPending.email??'',phone:'',password:'',confirmPassword:''}} validate={validateRegisterForm} onSubmit={auth.registerOAuth} submitLabel="Crear cuenta" loadingLabel="Creando cuenta…" secondaryAction={loading=><AppButton label="Cancelar" variant="secondary" disabled={loading} onPress={auth.cancelOAuth}/>}/></AppModal>;
}
