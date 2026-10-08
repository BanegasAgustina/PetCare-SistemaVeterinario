/** Vinculación explícita para usuarios autenticados; recibe identidad desde AuthContext, nunca por email. */
import { View } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import { useFeedback } from '../../contexts/FeedbackContext';
import { AppText } from './AppText';
import { AppButton } from './AppButton';
import { FormNotice } from './FormNotice';
export function OAuthLinks(){
  const auth=useAuth(),action=useAsyncAction(),feedback=useFeedback();
  return <View style={{gap:12}}><AppText variant="subtitle">Vincular inicio de sesión</AppText><AppText muted>Autorizá tu propia cuenta del proveedor para usarla al ingresar a PetCare.</AppText><FormNotice message={action.error} error/>
    <AppButton label="Vincular Google" disabled={action.loading} onPress={()=>void action.run(async()=>{await auth.linkProvider('google');feedback.showToast('Google vinculado.','success');})}/>
    <AppButton label="Vincular Facebook" disabled={action.loading} onPress={()=>void action.run(async()=>{await auth.linkProvider('facebook');feedback.showToast('Facebook vinculado.','success');})}/>
    <AppButton label="Vincular X" disabled={action.loading} onPress={()=>void action.run(async()=>{await auth.linkProvider('x');feedback.showToast('X vinculado.','success');})}/></View>;
}
