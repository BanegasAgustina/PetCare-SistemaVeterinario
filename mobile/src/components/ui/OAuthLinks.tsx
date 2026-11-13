/**
 * ARCHIVO: OAuthLinks.tsx
 * UBICACIÓN: mobile/src/components/ui/OAuthLinks.tsx
 * FUNCIÓN: Panel para revisar y desvincular proveedores OAuth de una cuenta autenticada.
 * RESPONSABILIDAD: Gestionar enlaces externos desde el perfil sin inferir identidad a partir del email.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/hooks/useAsyncAction.ts, mobile/src/contexts/FeedbackContext.tsx, mobile/src/components/ui/AppText.tsx, mobile/src/components/ui/AppButton.tsx, mobile/src/components/ui/FormNotice.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Consulta el contexto de autenticación, ejecuta acciones asincrónicas y reporta resultado con avisos dentro de la interfaz.
 * IMPORTANCIA: Controla la relación entre la cuenta PetCare y proveedores externos desde una sesión válida.
 */
/** Vinculación explícita para usuarios autenticados; recibe identidad desde AuthContext, nunca por email. */
import { View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { FormNotice } from './FormNotice';
/** Muestra y administra las acciones para vincular o desvincular proveedores de acceso OAuth. */
export function OAuthLinks(){
  const auth=useAuth(),action=useAsyncAction(),feedback=useFeedback();
  return <View style={{gap:12}}><AppText variant="subtitle">Vincular inicio de sesión</AppText><AppText muted>Autorizá tu propia cuenta del proveedor para usarla al ingresar a PetCare.</AppText><FormNotice message={action.error} error/>
    <AppButton label="Vincular Google" disabled={action.loading} onPress={()=>void action.run(async()=>{await auth.linkProvider('google');feedback.showToast('Google vinculado.','success');})}/>
    <AppButton label="Vincular Facebook" disabled={action.loading} onPress={()=>void action.run(async()=>{await auth.linkProvider('facebook');feedback.showToast('Facebook vinculado.','success');})}/>
    <AppButton label="Vincular X" disabled={action.loading} onPress={()=>void action.run(async()=>{await auth.linkProvider('x');feedback.showToast('X vinculado.','success');})}/></View>;
}
