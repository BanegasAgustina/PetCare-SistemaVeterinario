// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

/** Intercambia códigos por identidad con el proveedor; no persiste sus access tokens. */
import { createHmac } from 'node:crypto';
import { oauthConfig, type OAuthProvider } from '../config/oauth';
import { AppError } from '../utils/app-error';
// Tipo ProviderIdentity: define la forma o las opciones válidas de datos usados por este módulo.
export type ProviderIdentity = { subject: string; email: string | null; name: string | null };
type ProviderDiagnosticContext={correlationId?:string};
const safeProviderError=(value:unknown):string|undefined=>typeof value==='string'&&/^[A-Za-z0-9_.-]{1,80}$/.test(value)?value:undefined;
function safeProviderText(value:unknown):string|undefined{
  if(typeof value!=='string')return undefined;
  const safe=value.replace(/[\u0000-\u001f\u007f]/g,' ')
    .replace(/\b(access_token|refresh_token|bearer_token|client_id|client_secret|app_secret|api_key|api_secret|authorization_code|code_verifier|oauth_token|state|code|token|secret)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,&;]+)/gi,'$1=[REDACTED]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+=*/gi,'Bearer [REDACTED]')
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,'[REDACTED_EMAIL]')
    .replace(/\b[A-Za-z0-9_-]{48,}\b/g,'[REDACTED]')
    .trim().slice(0,240);
  return safe||undefined;
}
function providerHttpDiagnostics(details:Record<string,unknown>):Record<string,unknown>{
  const reason=safeProviderText(details.reason),type=safeProviderText(details.type),title=safeProviderText(details.title),detail=safeProviderText(details.detail);
  const all=[reason,type,title,detail].filter(Boolean).join(' ').toLowerCase();
  const providerError=/client[-_ ]not[-_ ]enrolled/.test(all)?'client-not-enrolled':safeProviderError(details.error);
  return {...(providerError?{providerError}:{}),...(reason?{reason}:{}),...(type?{type}:{}),...(title?{title}:{}),...(detail?{detail}:{})};
}
function logProviderFailure(context:ProviderDiagnosticContext,details:Record<string,unknown>):void{console.warn(JSON.stringify({event:'oauth.provider_failure',...context,...details}));}
/** Limita esperas y registra fase/status sin incluir URL, cabeceras ni respuestas completas. */
// Función json: concentra la lógica dentro de este módulo.
async function json(url:string,options:RequestInit={},provider?:OAuthProvider,stage?:string,context:ProviderDiagnosticContext={}):Promise<Record<string,unknown>> {
  let response:Response;
  try{response=await fetch(url,{...options,redirect:'error',signal:AbortSignal.timeout(10000)});}
  catch(error){logProviderFailure(context,{provider,stage,kind:error instanceof Error&&error.name==='TimeoutError'?'TIMEOUT':'NETWORK_ERROR',code:'OAUTH_PROVIDER_ERROR'});throw new AppError('OAUTH_PROVIDER_ERROR',502,'No pudimos verificar tu identidad con el proveedor. Volvé a intentar.');}
  let body:unknown;
  try{body=await response.json();}
  catch{logProviderFailure(context,{provider,stage,kind:'INVALID_JSON',status:response.status,code:'OAUTH_PROVIDER_ERROR'});throw new AppError('OAUTH_PROVIDER_ERROR',502,'No pudimos verificar tu identidad con el proveedor. Volvé a intentar.');}
  if(!response.ok){const details=body&&typeof body==='object'&&!Array.isArray(body)?body as Record<string,unknown>:{};logProviderFailure(context,{provider,stage,kind:'HTTP_ERROR',status:response.status,...(provider==='x'?providerHttpDiagnostics(details):{providerError:safeProviderError(details.error)}),code:'OAUTH_PROVIDER_ERROR'});throw new AppError('OAUTH_PROVIDER_ERROR',502,'No pudimos verificar tu identidad con el proveedor. Volvé a intentar.');}
  if(!body||typeof body!=='object'||Array.isArray(body)){logProviderFailure(context,{provider,stage,kind:'INVALID_RESPONSE',status:response.status,code:'OAUTH_PROVIDER_ERROR'});throw new AppError('OAUTH_PROVIDER_ERROR',502,'No pudimos verificar tu identidad con el proveedor. Volvé a intentar.');}
  return body as Record<string,unknown>;
}
// Función identity: concentra la lógica dentro de este módulo.
function identity(subject:unknown,email:unknown,name:unknown,emailVerified=false,provider?:OAuthProvider,context:ProviderDiagnosticContext={}):ProviderIdentity {
  if(typeof subject!=='string'||!/^[\x21-\x7e]{1,255}$/.test(subject)){logProviderFailure(context,{event:'oauth.profile_invalid_identity',provider,stage:'profile_normalization',field:'subject',code:'OAUTH_PROVIDER_ERROR'});throw new AppError('OAUTH_PROVIDER_ERROR',502,'El proveedor no devolvió una identidad válida.');}
  // Solo se usa el email verificado del proveedor como sugerencia; PetCare siempre pide su propio código.
  return {subject,email:emailVerified&&typeof email==='string'&&email.length<=254?email:null,name:typeof name==='string'&&name.length<=200?name:null};
}
// Función authorizationUrl: concentra la lógica dentro de este módulo.
export function authorizationUrl(provider:OAuthProvider,state:string,challenge:string):string {
  const c=oauthConfig(provider);const url=new URL(provider==='google'?'https://accounts.google.com/o/oauth2/v2/auth':provider==='facebook'?`https://www.facebook.com/${c.facebookVersion}/dialog/oauth`:'https://x.com/i/oauth2/authorize');
  url.search=new URLSearchParams({client_id:c.clientId,redirect_uri:c.callback,response_type:'code',state,scope:provider==='google'?'openid email profile':provider==='facebook'?'email,public_profile':'tweet.read users.read'}).toString();
  // Facebook usa cliente confidencial y state; Google/X también usan PKCE S256.
  if(provider!=='facebook'){url.searchParams.set('code_challenge',challenge);url.searchParams.set('code_challenge_method','S256');}return url.toString();
}
// Función providerIdentity: concentra la lógica dentro de este módulo.
export async function providerIdentity(provider:OAuthProvider,code:string,verifier:string,correlationId?:string):Promise<ProviderIdentity> {
  const context={...(correlationId?{correlationId}:{})};
  const c=oauthConfig(provider);
  if(provider==='facebook'){
    const root=`https://graph.facebook.com/${c.facebookVersion}`;
    // Meta's authorization-code exchange for Facebook Login is a GET request.
    // Keep its app secret server-side and never emit this URL in diagnostics.
    const tokenUrl=new URL(`${root}/oauth/access_token`);
    tokenUrl.search=new URLSearchParams({client_id:c.clientId,client_secret:c.clientSecret,redirect_uri:c.callback,code}).toString();
    const token=await json(tokenUrl.toString(),{},provider,'token_exchange',context);
    if(typeof token.access_token!=='string'){logProviderFailure(context,{provider,stage:'token_exchange',kind:'ACCESS_TOKEN_MISSING',code:'OAUTH_PROVIDER_ERROR'});throw new AppError('OAUTH_PROVIDER_ERROR',502,'No se recibió una autorización válida.');}
    // appsecret_proof vincula Graph al cliente confidencial de PetCare.
    const proof=createHmac('sha256',c.clientSecret).update(token.access_token).digest('hex');
    const profile=await json(`${root}/me?fields=id,name,email&appsecret_proof=${proof}`,{headers:{Authorization:`Bearer ${token.access_token}`}},provider,'profile',context);return identity(profile.id,profile.email,profile.name,false,provider,context);
  }
  const fields=new URLSearchParams({grant_type:'authorization_code',code,redirect_uri:c.callback,code_verifier:verifier});
  const headers:Record<string,string>={'Content-Type':'application/x-www-form-urlencoded','User-Agent':'PetCare-App/1.0'};
  if(provider==='google'){
    fields.set('client_id',c.clientId);
    fields.set('client_secret',c.clientSecret);
  } else {
    // X is configured as a confidential Web App. Its client authentication is
    // the Basic header alone; sending client_id in both the header and body is
    // rejected by OAuth servers as multiple client-authentication methods.
    // RFC 6749 requires form-encoding each credential before constructing it.
    const formEncode=(value:string)=>new URLSearchParams({value}).toString().slice('value='.length);
    headers.Authorization=`Basic ${Buffer.from(`${formEncode(c.clientId)}:${formEncode(c.clientSecret)}`).toString('base64')}`;
  }
  const token=await json(provider==='google'?'https://oauth2.googleapis.com/token':'https://api.x.com/2/oauth2/token',{method:'POST',headers,body:fields},provider,'token_exchange',context);
  if(typeof token.access_token!=='string'){logProviderFailure(context,{provider,stage:'token_exchange',kind:'ACCESS_TOKEN_MISSING',code:'OAUTH_PROVIDER_ERROR'});throw new AppError('OAUTH_PROVIDER_ERROR',502,'No se recibió una autorización válida.');}
  const profileHeaders:Record<string,string>={Authorization:`Bearer ${token.access_token}`,'User-Agent':'PetCare-App/1.0'};
  const profileUrl=provider==='google'?'https://openidconnect.googleapis.com/v1/userinfo':'https://api.x.com/2/users/me?user.fields=name';
  const profile=await json(profileUrl,{headers:profileHeaders},provider,'profile',context);
  if(provider==='google')return identity(profile.sub,profile.email,profile.name,profile.email_verified===true,provider,context);
  const data=profile.data as Record<string,unknown>|undefined;return identity(data?.id,null,data?.name,false,provider,context);
}
