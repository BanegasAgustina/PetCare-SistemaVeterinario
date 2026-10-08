/** Retorno del navegador OAuth. Cierra el popup web; nunca recibe tokens PetCare ni decide el rol. */
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { useAuth } from '../hooks/useAuth';
import { roleHome } from '../utils/role-home';
import { Platform } from 'react-native';
export default function OAuthReturn(){
  const {user}=useAuth();
  useEffect(()=>{WebBrowser.maybeCompleteAuthSession();},[]);
  // Linking puede abrir esta ruta antes del canje; navegar solo después de confirmar /me.
  useEffect(()=>{if(user&&Platform.OS!=='web')router.replace(roleHome(user));},[user]);
  return <ScreenContainer><AppText variant="title">Volvé a PetCare</AppText><AppText>El acceso continúa en la ventana donde lo iniciaste. Si la cerraste, iniciá el proceso nuevamente.</AppText><AppButton label="Volver al inicio" onPress={()=>router.replace('/')}/></ScreenContainer>;
}
