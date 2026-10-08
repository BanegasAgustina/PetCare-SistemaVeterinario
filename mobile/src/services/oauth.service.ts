/** Abre OAuth en navegador seguro. Guarda la prueba solo en memoria y canjea tickets por POST. */
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { apiRequest,ApiError } from './api';
import { readAccessSession } from './auth.service';
import type { AccessSession,RegisterValues,VerificationChallenge } from '../types/auth';
export type OAuthProvider = 'google'|'facebook'|'x';
export type OAuthPending = {ticket:string;proof:string;email:string|null};
type Exchange = {session?:AccessSession;linked?:boolean;registrationRequired?:boolean;email?:string|null};
type OAuthStart = {configured?:boolean;url?:string};
function returnUrl():string {
  if(Platform.OS!=='web')return 'petcare://oauth';
  // WebBrowser cierra la ventana emergente solo desde el mismo origen HTTPS.
  return `${globalThis.location.origin}/oauth`;
}
function base64Url(value:string):string {return value.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
/** Genera prueba criptográfica y valida el destino del retorno; un proveedor no puede elegir el panel. */
export async function beginOAuth(provider:OAuthProvider,accessToken?:string):Promise<{session?:AccessSession;linked?:boolean;pending?:OAuthPending}> {
  // Reservar la ventana dentro del click conserva el gesto del usuario mientras se prepara PKCE/red.
  const windowName='petcare-oauth';
  const popup=Platform.OS==='web'?globalThis.open('',windowName,'popup,width=500,height=700'):null;
  if(Platform.OS==='web'&&!popup)throw new ApiError('OAUTH_POPUP_BLOCKED','Permití ventanas emergentes para PetCare y volvé a intentar.');
  try {
  const random=await Crypto.getRandomBytesAsync(32);
  // Hex tiene 64 caracteres y cumple el alfabeto PKCE; no se usa Math.random.
  const proof=Array.from(random,b=>b.toString(16).padStart(2,'0')).join('');
  const challenge=base64Url(await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256,proof,{encoding:Crypto.CryptoEncoding.BASE64}));
  const destination=returnUrl();
  const start=await apiRequest<OAuthStart>(`/auth/oauth/${provider}/${accessToken?'link':'start'}`,{method:'POST',accessToken,body:{challenge,returnUrl:destination}});
  if(start.configured===false)throw new ApiError('OAUTH_UNAVAILABLE','Este proveedor todav\u00eda no est\u00e1 configurado.');
  if(typeof start.url!=='string')throw new ApiError('INVALID_RESPONSE','No pudimos iniciar la autorizaci?n. Volv? a intentar.');
  const result=await WebBrowser.openAuthSessionAsync(start.url,destination,{windowName});
  if(result.type!=='success')throw new ApiError('OAUTH_CANCELLED','La autorización no se completó.');
  const callback=new URL(result.url);
  if(`${callback.protocol}//${callback.host}${callback.pathname}`!==destination||callback.searchParams.has('error'))throw new ApiError('OAUTH_FAILED','El proveedor no completó el acceso. Volvé a intentar.');
  const ticket=callback.searchParams.get('ticket');
  if(!ticket||!/^[a-f0-9]{64}$/.test(ticket))throw new ApiError('INVALID_RESPONSE','La respuesta OAuth no es válida.');
  const exchange=await apiRequest<Exchange>('/auth/oauth/exchange',{method:'POST',body:{ticket,proof}});
  if(exchange.session)return {session:readAccessSession(exchange.session)};
  if(exchange.linked===true)return {linked:true};
  if(exchange.registrationRequired===true)return {pending:{ticket,proof,email:typeof exchange.email==='string'?exchange.email:null}};
  throw new ApiError('INVALID_RESPONSE','La respuesta OAuth no es válida.');
  } finally {popup?.close();}
}
export async function completeOAuth(pending:OAuthPending,profile:RegisterValues):Promise<VerificationChallenge> {
  const {confirmPassword,...input}=profile;
  if(profile.password!==confirmPassword)throw new ApiError('VALIDATION_ERROR','Las contraseñas no coinciden.');
  const result=await apiRequest<{verification:VerificationChallenge}>('/auth/oauth/register',{method:'POST',body:{ticket:pending.ticket,proof:pending.proof,profile:input}});
  return result.verification;
}
