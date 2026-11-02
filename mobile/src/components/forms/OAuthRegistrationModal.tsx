/**
 * ARCHIVO: OAuthRegistrationModal.tsx
 * UBICACIÓN: mobile/src/components/forms/OAuthRegistrationModal.tsx
 * FUNCIÓN: Modal para completar el perfil y contraseña de una identidad OAuth pendiente de registro.
 * RESPONSABILIDAD: Solicitar los datos PetCare requeridos después de que el backend reconoce un proveedor nuevo.
 * CONEXIONES: Importa: mobile/src/components/ui/AppModal.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/forms/AuthForm.tsx, mobile/src/hooks/useAuth.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/_layout.tsx
 * FUNCIONAMIENTO: Consulta oauthPending del contexto, valida el formulario y llama a la finalización OAuth; la prueba/ticket los administra el servicio.
 * IMPORTANCIA: Completa alta sin confundir la identidad externa con una cuenta PetCare ya activada.
 */
/** Completa una identidad OAuth nueva con datos reales; reutiliza verificación de email del AuthContext. */
import { AppModal } from '../ui/AppModal';
import { AppText } from '../ui/AppText';
import { AppButton } from '../ui/AppButton';
import { AuthForm,type AuthField } from './AuthForm';
import { useAuth } from '../../hooks/useAuth';
import { validateRegisterForm } from '../../utils/auth-validation';
import type { RegisterValues } from '../../types/auth';
// Configuración fields: reúne valores o reglas que consume el resto del módulo.
const fields:AuthField<RegisterValues>[]=[
  {key:'firstName',label:'Nombre',inputProps:{autoCapitalize:'words',maxLength:100}},
  {key:'lastName',label:'Apellido',inputProps:{autoCapitalize:'words',maxLength:100}},
  {key:'email',label:'Correo electrónico',inputProps:{keyboardType:'email-address',autoCapitalize:'none',autoCorrect:false,maxLength:254}},
  {key:'phone',label:'Teléfono (opcional)',inputProps:{keyboardType:'phone-pad',maxLength:40}},
  {key:'password',label:'Contraseña de PetCare',password:true,hint:'8 caracteres, mayúscula, minúscula, número y símbolo.'},
  {key:'confirmPassword',label:'Repetir contraseña',password:true},
];
/** Solo aparece cuando AuthContext conserva un registro OAuth pendiente. */
export function OAuthRegistrationModal(){
  const auth=useAuth();if(!auth.oauthPending)return null;
  return <AppModal visible><AppText variant="subtitle">Completá tu cuenta</AppText><AppText muted>Verificaremos tu correo con un código. Si ya tenés una cuenta, cancelá e iniciá sesión con tu contraseña para vincular este proveedor.</AppText>
    <AuthForm fields={fields} initialValues={{firstName:'',lastName:'',email:auth.oauthPending.email??'',phone:'',password:'',confirmPassword:''}} validate={validateRegisterForm} onSubmit={auth.registerOAuth} submitLabel="Crear cuenta" loadingLabel="Creando cuenta…" secondaryAction={loading=><AppButton label="Cancelar" variant="secondary" disabled={loading} onPress={auth.cancelOAuth}/>}/></AppModal>;
}
