/** Inicia OAuth: web redirige la pestaña y Android usa el navegador seguro; tickets se canjean por POST. */
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { apiRequest,ApiError } from './api';
import { readAccessSession } from './auth.service';
import type { AccessSession,RegisterValues,VerificationChallenge } from '../types/auth';
import { clearWebOAuthProof,readWebOAuthProof,saveWebOAuthProof } from './web-session-store';
export type OAuthProvider = 'google'|'facebook'|'x';
export type OAuthPending = {ticket:string;proof:string;email:string|null};
type Exchange = {session?:AccessSession;linked?:boolean;registrationRequired?:boolean;email?:string|null};
type OAuthStart = {configured?:boolean;reason?:string;url?:string};
type OAuthResult = {session?:AccessSession;linked?:boolean;pending?:OAuthPending};
function returnUrl():string {
  if(Platform.OS!=='web')return 'petcare://oauth';
  // WebBrowser cierra la ventana emergente solo desde el mismo origen HTTPS.
  return `${globalThis.location.origin}/oauth`;
}
function base64Url(value:string):string {return value.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
/** Genera prueba criptográfica y valida el destino del retorno; un proveedor no puede elegir el panel. */
export async function beginOAuth(provider:OAuthProvider,accessToken?:string):Promise<OAuthResult|{redirecting:true}> {
  // Reservar la ventana dentro del click conserva el gesto del usuario mientras se prepara PKCE/red.
  const windowName='petcare-oauth';
  const usePopup=Platform.OS==='web'&&Boolean(accessToken);
  const popup=usePopup?globalThis.open('',windowName,'popup,width=500,height=700'):null;
  if(usePopup&&!popup)throw new ApiError('OAUTH_POPUP_BLOCKED','Permití ventanas emergentes para PetCare y volvé a intentar.');
  try {
  const random=await Crypto.getRandomBytesAsync(32);
  // Hex tiene 64 caracteres y cumple el alfabeto PKCE; no se usa Math.random.
  const proof=Array.from(random,b=>b.toString(16).padStart(2,'0')).join('');
  const challenge=base64Url(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,proof,{encoding:Crypto.CryptoEncoding.BASE64}));
  const destination=returnUrl();
  const start=await apiRequest<OAuthStart>(`/auth/oauth/${provider}/${accessToken?'link':'start'}`,{method:'POST',accessToken,body:{challenge,returnUrl:destination}});
  if(start.configured===false){const issue=start.reason==='CREDENTIALS_MISSING'?'El inicio de sesión con X no está disponible en este momento. Elegí otra opción o intentá más tarde.':start.reason==='RETURN_URL_NOT_ALLOWED'||start.reason==='BACKEND_URL_INVALID'?'No pudimos iniciar sesión con este proveedor. Intentá nuevamente más tarde.':'El inicio de sesión con este proveedor no está disponible en este momento.';throw new ApiError('OAUTH_UNAVAILABLE',issue);}
  if(typeof start.url!=='string')throw new ApiError('INVALID_RESPONSE','No pudimos iniciar el acceso. Volvé a intentarlo.');
  if(Platform.OS==='web'&&!accessToken){
    saveWebOAuthProof(proof);
    globalThis.location.assign(start.url);
    return {redirecting:true};
  }
  const result=await WebBrowser.openAuthSessionAsync(start.url,destination,{windowName});
  if(result.type!=='success')throw new ApiError('OAUTH_CANCELLED','La autorización no se completó.');
  const callback=new URL(result.url);
  const callbackError=callback.searchParams.get('error');
  if(callbackError)throw new ApiError(callbackError,callbackError==='OAUTH_PROVIDER_DENIED'?'X rechazó o canceló la autorización. Revisá los permisos de tu cuenta e intentá nuevamente.':callbackError==='OAUTH_PROVIDER_ERROR'?'X autorizó el acceso, pero no pudimos completar el inicio de sesión. Intentá nuevamente más tarde.':'No pudimos completar el inicio de sesión. Intentá nuevamente.');
  if(`${callback.protocol}//${callback.host}${callback.pathname}`!==destination||callback.searchParams.has('error'))throw new ApiError('OAUTH_FAILED','El proveedor no completó el acceso. Volvé a intentar.');
  const ticket=callback.searchParams.get('ticket');
  if(!ticket||!/^[a-f0-9]{64}$/.test(ticket))throw new ApiError('INVALID_RESPONSE','La respuesta OAuth no es válida.');
  return exchangeOAuthTicket(ticket,proof);
  } finally {popup?.close();}
}
async function exchangeOAuthTicket(ticket:string,proof:string):Promise<OAuthResult> {
  const exchange=await apiRequest<Exchange>('/auth/oauth/exchange',{method:'POST',body:{ticket,proof}});
  if(exchange.session)return {session:readAccessSession(exchange.session)};
  if(exchange.linked===true)return {linked:true};
  if(exchange.registrationRequired===true)return {pending:{ticket,proof,email:typeof exchange.email==='string'?exchange.email:null}};
  throw new ApiError('INVALID_RESPONSE','La respuesta OAuth no es válida.');
}
export function clearWebOAuthReturn():void {
  if(Platform.OS==='web')clearWebOAuthProof();
}
export async function exchangeWebOAuthReturn(ticket:string):Promise<OAuthResult> {
  if(Platform.OS!=='web'||!/^[a-f0-9]{64}$/.test(ticket))throw new ApiError('OAUTH_FAILED','La respuesta OAuth no es válida. Iniciá el proceso nuevamente.');
  const proof=readWebOAuthProof();
  if(!proof)throw new ApiError('OAUTH_INVALID_PROOF','No encontramos el inicio de sesión pendiente. Volvé a intentar.');
  try {
    const result=await exchangeOAuthTicket(ticket,proof);
    clearWebOAuthProof();
    return result;
  } catch(error) {
    // EMAIL_NOT_VERIFIED is returned after the backend consumes this one-time ticket.
    if(error instanceof ApiError&&error.code==='EMAIL_NOT_VERIFIED')clearWebOAuthProof();
    throw error;
  }
}
export async function completeOAuth(pending:OAuthPending,profile:RegisterValues):Promise<VerificationChallenge> {
  const {confirmPassword,...input}=profile;
  if(profile.password!==confirmPassword)throw new ApiError('VALIDATION_ERROR','Las contraseñas no coinciden.');
  const result=await apiRequest<{verification:VerificationChallenge}>('/auth/oauth/register',{method:'POST',body:{ticket:pending.ticket,proof:pending.proof,profile:input}});
  return result.verification;
}
