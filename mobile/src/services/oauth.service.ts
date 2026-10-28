// Este archivo se encarga de lo siguiente: Servicio de la app móvil; agrupa comunicación con la API o manejo de sesión y eventos.

/** Inicia OAuth: web redirige la pestaña y Android usa el navegador seguro; tickets se canjean por POST. */
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { apiRequest,ApiError } from './api';
import { readAccessSession } from './auth.service';
import type { AccessSession,RegisterValues,VerificationChallenge } from '../types/auth';
import { clearWebOAuthProof,readWebOAuthProof,saveWebOAuthProof } from './web-session-store';
import { nativeOAuthSupported,oauthBrowserResultError,parseOAuthCallback } from './oauth-flow';
// Tipo OAuthProvider: define la forma o las opciones válidas de los datos usados por este módulo.
export type OAuthProvider = 'google'|'facebook'|'x';
export type OAuthProviderAvailability = Record<OAuthProvider,boolean>;
// Tipo OAuthPending: define la forma o las opciones válidas de los datos usados por este módulo.
export type OAuthPending = {ticket:string;proof:string;email:string|null};
// Tipo Exchange: define la forma o las opciones válidas de los datos usados por este módulo.
type Exchange = {session?:AccessSession;linked?:boolean;registrationRequired?:boolean;email?:string|null};
// Tipo OAuthStart: define la forma o las opciones válidas de los datos usados por este módulo.
type OAuthStart = {configured?:boolean;reason?:string;url?:string};
// Tipo OAuthResult: define la forma o las opciones válidas de los datos usados por este módulo.
type OAuthResult = {session?:AccessSession;linked?:boolean;pending?:OAuthPending};
// Función oauthDiagnostic: concentra la lógica dentro de este módulo.
export function oauthDiagnostic(event:string,provider:OAuthProvider|'web',details:Record<string,string|boolean>={}):void {
  if(__DEV__)console.info('[PetCare OAuth]',JSON.stringify({event,provider,...details}));
}
// Función returnUrl: concentra la lógica dentro de este módulo.
function returnUrl():string {
  if(Platform.OS!=='web')return 'petcare://oauth';
  // WebBrowser cierra la ventana emergente solo desde el mismo origen HTTPS.
  return `${globalThis.location.origin}/oauth`;
}
/** Consulta solo si el backend tiene este proveedor configurado para el retorno de esta plataforma. */
export async function getOAuthProviderAvailability():Promise<OAuthProviderAvailability> {
  const query=new URLSearchParams({returnUrl:returnUrl()});
  const result=await apiRequest<{providers?:Partial<OAuthProviderAvailability>}>(`/auth/oauth/providers?${query.toString()}`);
  return {google:result.providers?.google===true,facebook:result.providers?.facebook===true,x:result.providers?.x===true};
}
// Función base64Url: concentra la lógica dentro de este módulo.
function base64Url(value:string):string {return value.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
/** Genera prueba criptográfica y valida el destino del retorno; un proveedor no puede elegir el panel. */
// Función beginOAuth: concentra la lógica dentro de este módulo.
export async function beginOAuth(provider:OAuthProvider,accessToken?:string):Promise<OAuthResult|{redirecting:true}> {
  if(!nativeOAuthSupported(Platform.OS,isRunningInExpoGo())){
    oauthDiagnostic('development_build_required',provider);
    throw new ApiError('OAUTH_REQUIRES_DEVELOPMENT_BUILD','El inicio con Google, Facebook y X requiere la versión de desarrollo de PetCare. Instalá la development build y volvé a intentar.');
  }
  oauthDiagnostic('started',provider,{linking:Boolean(accessToken)});
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
  oauthDiagnostic('backend_start_requested',provider);
  const start=await apiRequest<OAuthStart>(`/auth/oauth/${provider}/${accessToken?'link':'start'}`,{method:'POST',accessToken,body:{challenge,returnUrl:destination}});
  oauthDiagnostic('backend_start_responded',provider,{configured:start.configured!==false});
  if(start.configured===false){const issue=start.reason==='CREDENTIALS_MISSING'?'Este proveedor no está configurado en este momento. Elegí otra opción o intentá más tarde.':start.reason==='RETURN_URL_NOT_ALLOWED'||start.reason==='BACKEND_URL_INVALID'?'No pudimos iniciar sesión con este proveedor. Intentá nuevamente más tarde.':'El inicio de sesión con este proveedor no está disponible en este momento.';throw new ApiError('OAUTH_UNAVAILABLE',issue);}
  if(typeof start.url!=='string')throw new ApiError('INVALID_RESPONSE','No pudimos iniciar el acceso. Volvé a intentarlo.');
  if(Platform.OS==='web'&&!accessToken){
    saveWebOAuthProof(proof);
    oauthDiagnostic('web_redirecting',provider);
    globalThis.location.assign(start.url);
    return {redirecting:true};
  }
  oauthDiagnostic('browser_opening',provider);
  let timeout:ReturnType<typeof setTimeout>|undefined;
  const result=await Promise.race([
    WebBrowser.openAuthSessionAsync(start.url,destination,{windowName}),
    new Promise<never>((_,reject)=>{timeout=setTimeout(()=>{void WebBrowser.dismissBrowser().catch(()=>undefined);reject(new ApiError('OAUTH_TIMEOUT','La autorización tardó demasiado y no volvió a PetCare. Cerrá el navegador e intentá nuevamente.',408));},120_000);}),
  ]).finally(()=>{if(timeout)clearTimeout(timeout);});
  oauthDiagnostic('browser_returned',provider,{result:result.type});
  const browserError=oauthBrowserResultError(result.type);
  if(browserError)throw new ApiError(browserError,'La autorización se canceló o no llegó a PetCare. Podés volver a intentarlo.');
  if(result.type!=='success')throw new ApiError('OAUTH_CANCELLED','La autorización se canceló o no llegó a PetCare. Podés volver a intentarlo.');
  let callbackResult;
  try{callbackResult=parseOAuthCallback(result.url,destination);}catch(error){const code=error instanceof Error?error.message:'OAUTH_FAILED';oauthDiagnostic('callback_invalid',provider,{code});throw new ApiError(code,code==='OAUTH_FAILED'?'El retorno no llegó al vínculo seguro de PetCare. Volvé a intentarlo desde una development build.':'La respuesta OAuth no es válida. Volvé a intentar.');}
  oauthDiagnostic('callback_received',provider,{hasTicket:'ticket' in callbackResult,hasProviderError:'error' in callbackResult});
  if('error' in callbackResult){const label=provider==='x'?'X':provider==='google'?'Google':'Facebook';const callbackError=callbackResult.error;throw new ApiError(callbackError,callbackError==='OAUTH_PROVIDER_DENIED'?`${label} rechazó o canceló la autorización. Revisá los permisos e intentá nuevamente.`:callbackError==='OAUTH_PROVIDER_ERROR'?`${label} no pudo completar la autorización. Intentá nuevamente más tarde.`:'No pudimos completar el inicio de sesión. Intentá nuevamente.');}
  return exchangeOAuthTicket(callbackResult.ticket,proof,provider);
  }catch(error){oauthDiagnostic('failed',provider,{code:error instanceof ApiError?error.code:'UNEXPECTED_ERROR'});throw error;
  } finally {popup?.close();}
}
// Función exchangeOAuthTicket: concentra la lógica dentro de este módulo.
async function exchangeOAuthTicket(ticket:string,proof:string,provider:OAuthProvider|'web'='web'):Promise<OAuthResult> {
  oauthDiagnostic('backend_exchange_started',provider);
  const exchange=await apiRequest<Exchange>('/auth/oauth/exchange',{method:'POST',body:{ticket,proof}});
  oauthDiagnostic('backend_exchange_responded',provider,{session:Boolean(exchange.session),linked:exchange.linked===true,registrationRequired:exchange.registrationRequired===true});
  if(exchange.session)return {session:readAccessSession(exchange.session)};
  if(exchange.linked===true)return {linked:true};
  if(exchange.registrationRequired===true)return {pending:{ticket,proof,email:typeof exchange.email==='string'?exchange.email:null}};
  throw new ApiError('INVALID_RESPONSE','La respuesta OAuth no es válida.');
}
// Función clearWebOAuthReturn: concentra la lógica dentro de este módulo.
export function clearWebOAuthReturn():void {
  if(Platform.OS==='web')clearWebOAuthProof();
}
// Función exchangeWebOAuthReturn: concentra la lógica dentro de este módulo.
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
// Función completeOAuth: concentra la lógica dentro de este módulo.
export async function completeOAuth(pending:OAuthPending,profile:RegisterValues):Promise<VerificationChallenge> {
  const {confirmPassword,...input}=profile;
  if(profile.password!==confirmPassword)throw new ApiError('VALIDATION_ERROR','Las contraseñas no coinciden.');
  const result=await apiRequest<{verification:VerificationChallenge}>('/auth/oauth/register',{method:'POST',body:{ticket:pending.ticket,proof:pending.proof,profile:input}});
  return result.verification;
}
