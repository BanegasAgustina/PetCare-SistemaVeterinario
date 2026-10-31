// Este archivo se encarga de lo siguiente: Pantalla de entrada o autenticación de la aplicación móvil; guía el acceso y la navegación inicial.

/** Retorno del navegador OAuth. Cierra el popup web; nunca recibe tokens PetCare ni decide el rol. */
import { useEffect, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ScreenContainer } from '../components/layout/ScreenContainer';
import { AppText } from '../components/ui/AppText';
import { AppButton } from '../components/ui/AppButton';
import { useAuth } from '../hooks/useAuth';
import { roleHome } from '../utils/role-home';
import { Platform } from 'react-native';
import { ApiError, friendlyError } from '../services/api';
import { clearWebOAuthReturn } from '../services/oauth.service';
// Función clearCallbackQuery: concentra la lógica dentro de este módulo.
function clearCallbackQuery():void {
  window.history.replaceState(window.history.state,'',window.location.pathname);
}
// Función OAuthReturn: concentra la lógica dentro de este módulo.
export default function OAuthReturn(){
  const {user,completeWebOAuthReturn}=useAuth();
  const params=useLocalSearchParams<{ticket?:string|string[];error?:string|string[]}>();
  const handled=useRef(false);
  const [error,setError]=useState<string|null>(null);
  const [authenticated,setAuthenticated]=useState(false);
  const ticket=typeof params.ticket==='string'?params.ticket:null;
  const callbackError=typeof params.error==='string'?params.error:null;
  const hasCallback=Boolean(ticket||callbackError);
  useEffect(()=>{
    if(Platform.OS!=='web'||handled.current)return;
    if(!ticket&&!callbackError)return;
    handled.current=true;
    if(callbackError){void Promise.resolve().then(()=>{try{clearWebOAuthReturn();clearCallbackQuery();}catch(failure){setError(friendlyError(failure));return;}setError(friendlyError(new ApiError(callbackError,'El proveedor no pudo completar el inicio de sesión. Volvé a intentar.')));});return;}
    if(!ticket){void Promise.resolve().then(()=>setError('La respuesta OAuth no es válida. Iniciá el proceso nuevamente.'));return;}
    void completeWebOAuthReturn(ticket).then(result=>{
      clearCallbackQuery();
      if(result)setAuthenticated(true);
      else router.replace('/login');
    }).catch(failure=>setError(friendlyError(failure)));
  },[ticket,callbackError,completeWebOAuthReturn]);
  useEffect(()=>{if((authenticated||Platform.OS!=='web')&&user)router.replace(roleHome(user));},[authenticated,user]);
  return <ScreenContainer><AppText variant="title">{error?'No se pudo iniciar sesión':authenticated||user?'Ingresando a PetCare…':hasCallback?'Conectando con PetCare…':'Volvé a PetCare'}</AppText>{error?<><AppText>{error}</AppText>{ticket&&<AppButton label="Reintentar" onPress={()=>window.location.reload()}/>}<AppButton label="Volver al inicio de sesión para reintentar" onPress={()=>router.replace('/login')}/></>:!hasCallback&&!user?<><AppText>El acceso continúa en la ventana donde se inició. Si la cerraste, iniciá el proceso nuevamente.</AppText><AppButton label="Volver al inicio de sesión" onPress={()=>router.replace('/login')}/></>:null}</ScreenContainer>;
}
