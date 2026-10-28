// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

/** Intercambia códigos por identidad con el proveedor; no persiste sus access tokens. */
import { createHmac } from 'node:crypto';
import { oauthConfig, type OAuthProvider } from '../config/oauth';
import { AppError } from '../utils/app-error';
// Tipo ProviderIdentity: define la forma o las opciones válidas de datos usados por este módulo.
export type ProviderIdentity = { subject: string; email: string | null; name: string | null };
/** Limita esperas y oculta respuestas externas que podrían incluir credenciales. */
// Función json: concentra la lógica dentro de este módulo.
async function json(url: string, options: RequestInit = {}, provider?: OAuthProvider, stage?: string): Promise<Record<string,unknown>> {
  try {const response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(10000)});const body:unknown=await response.json();
    if(!response.ok||!body||typeof body!=='object'||Array.isArray(body)){
      const details=body&&typeof body==='object'&&!Array.isArray(body)?body as Record<string,unknown>:{};
      // X/Google/Facebook error codes help distinguish a portal/configuration
      // rejection from a network failure. Never log the response body or tokens.
      const providerError=typeof details.error==='string'?details.error.slice(0,80):undefined;
      console.warn(JSON.stringify({event:'oauth.provider_http_error',provider,stage,status:response.status,providerError}));throw new Error();
    }return body as Record<string,unknown>;
  }catch{if(provider)console.warn(JSON.stringify({event:'oauth.provider_request_failed',provider,stage}));throw new AppError('OAUTH_PROVIDER_ERROR',502,'No pudimos verificar tu identidad con el proveedor. Volvé a intentar.');}
}
// Función identity: concentra la lógica dentro de este módulo.
function identity(subject:unknown,email:unknown,name:unknown,emailVerified=false):ProviderIdentity {
  if(typeof subject!=='string'||!/^[\x21-\x7e]{1,255}$/.test(subject))throw new AppError('OAUTH_PROVIDER_ERROR',502,'El proveedor no devolvió una identidad válida.');
  // Solo se usa el email verificado del proveedor como sugerencia; PetCare siempre pide su propio código.
  return {subject,email:emailVerified&&typeof email==='string'&&email.length<=254?email:null,name:typeof name==='string'&&name.length<=200?name:null};
}
// Función authorizationUrl: concentra la lógica dentro de este módulo.
export function authorizationUrl(provider:OAuthProvider,state:string,challenge:string):string {
  const c=oauthConfig(provider);const url=new URL(provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':provider==='facebook'?`https://www.facebook.com/${c.facebookVersion}/dialog/oauth`:'https://x.com/i/oauth2/authorize');
  url.search=new URLSearchParams({client_id:c.clientId,redirect_uri:c.callback,response_type:'code',state,scope:provider==='google'?'openid email profile':provider==='facebook'?'email,public_profile':'users.read'}).toString();
  // Facebook usa cliente confidencial y state; Google/X también usan PKCE S256.
  if(provider!=='facebook'){url.searchParams.set('code_challenge',challenge);url.searchParams.set('code_challenge_method','S256');}return url.toString();
}
// Función providerIdentity: concentra la lógica dentro de este módulo.
export async function providerIdentity(provider:OAuthProvider,code:string,verifier:string):Promise<ProviderIdentity> {
  const c=oauthConfig(provider);
  if(provider==='facebook'){
    const root=`https://graph.facebook.com/${c.facebookVersion}`;
    const token=await json(`${root}/oauth/access_token`,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:c.clientId,client_secret:c.clientSecret,redirect_uri:c.callback,code})},provider,'token_exchange');
    if(typeof token.access_token!=='string')throw new AppError('OAUTH_PROVIDER_ERROR',502,'No se recibió una autorización válida.');
    // appsecret_proof vincula Graph al cliente confidencial de PetCare.
    const proof=createHmac('sha256',c.clientSecret).update(token.access_token).digest('hex');
    const profile=await json(`${root}/me?fields=id,name,email&appsecret_proof=${proof}`,{headers:{Authorization:`Bearer ${token.access_token}`}},provider,'profile');return identity(profile.id,profile.email,profile.name);
  }
  const fields=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:c.callback,code_verifier:verifier});
  const headers:Record<string,string>={'Content-Type':'application/x-www-form-urlencoded','User-Agent':'PetCare-App/1.0'};
  if(provider==='google'){
    fields.set('client_id',c.clientId);
    fields.set('client_secret',c.clientSecret);
  } else {
    fields.set('client_id',c.clientId);
    headers.Authorization=`Basic ${Buffer.from(`${c.clientId}:${c.clientSecret}`).toString('base64')}`;
  }
  const token=await json(provider==='google'?'https://oauth2.googleapis.com/token':'https://api.x.com/2/oauth2/token',{method:'POST',headers,body:fields},provider,'token_exchange');
  if(typeof token.access_token!=='string')throw new AppError('OAUTH_PROVIDER_ERROR',502,'No se recibió una autorización válida.');
  const profileHeaders:Record<string,string>={Authorization:`Bearer ${token.access_token}`,'User-Agent':'PetCare-App/1.0'};
  const profile=await json(provider==='google'?'https://openidconnect.googleapis.com/v1/userinfo':'https://api.x.com/2/users/me',{headers:profileHeaders},provider,'profile');
  if(provider==='google')return identity(profile.sub,profile.email,profile.name,profile.email_verified===true);
  const data=profile.data as Record<string,unknown>|undefined;return identity(data?.id,null,data?.name);
}
