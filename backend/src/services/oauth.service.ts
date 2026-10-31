// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

/** Coordina OAuth, vínculo explícito y alta con email verificado. MySQL decide el rol. */
import { createHash,randomBytes } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { oauthConfig,oauthConfigured,oauthConfigurationIssue,oauthReturnUrl,type OAuthProvider } from '../config/oauth';
import * as repo from '../repositories/oauth.repository';
import { authorizationUrl,providerIdentity } from './oauth-provider.service';
import { findUserById,findUserByEmail } from '../repositories/user.repository';
import { sessionForUser } from './session.service';
import { assertOAuthRegistrationEmailAvailable, oauthExchangeAction } from './oauth-policy';
import { validateRegister } from '../validators/auth.validator';
import { hashPassword } from './password.service';
import { createVerificationProof,resendVerification,hashVerificationToken } from './verification.service';
import { getMailConfiguration,getVerificationSecret } from '../config/mail';
import { AppError } from '../utils/app-error';
// Función object: concentra la lógica dentro de este módulo.
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new AppError('VALIDATION_ERROR',400,'La solicitud debe ser JSON.');return value as Record<string,unknown>;}
/** Guarda state aleatorio, PKCE del proveedor y prueba del dispositivo en un intento limitado a diez minutos. */
// Función startOAuth: concentra la lógica dentro de este módulo.
export async function startOAuth(provider:OAuthProvider,value:unknown,linkId?:string,linkFamily?:string){
  const body=object(value);if(!oauthConfigured(provider,body.returnUrl)){const reason=oauthConfigurationIssue(provider,body.returnUrl);console.warn(JSON.stringify({event:'oauth.start_unavailable',provider,reason}));return {configured:false as const,reason};}oauthConfig(provider);if(typeof body.challenge!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.challenge))throw new AppError('VALIDATION_ERROR',400,'La prueba OAuth no es válida.');
  const returnUrl=oauthReturnUrl(body.returnUrl),user=linkId?await findUserById(linkId):null;
  if(linkId&&(!user||!user.isActive||!user.emailVerifiedAt||!linkFamily))throw new AppError('INVALID_TOKEN',401,'Volvé a iniciar sesión antes de vincular un proveedor.');
  const a=await repo.createAttempt(provider,body.challenge,returnUrl,user?{id:user.id,version:user.sessionVersion,family:linkFamily!}:undefined);return {configured:true as const,url:authorizationUrl(provider,a.state,createHash('sha256').update(a.verifier).digest('base64url'))};
}
/** Reclama state una sola vez y devuelve un ticket breve; nunca redirige access/refresh tokens. */
// Función callbackOAuth: concentra la lógica dentro de este módulo.
export async function callbackOAuth(provider:OAuthProvider,state:unknown,code:unknown,error:unknown,correlationId?:string):Promise<string>{
  const diagnostic={provider,...(correlationId?{correlationId}:{})};
  console.info(JSON.stringify({event:'oauth.callback_received',...diagnostic}));
  const a=await repo.claimCallback(provider,state),destination=new URL(a.return_url);
  console.info(JSON.stringify({event:'oauth.state_validated',...diagnostic}));
  if(error){console.warn(JSON.stringify({event:'oauth.provider_denied',...diagnostic,code:'OAUTH_PROVIDER_DENIED'}));destination.searchParams.set('error','OAUTH_PROVIDER_DENIED');return destination.toString();}
  if(typeof code!=='string'||!code||code.length>4096){console.warn(JSON.stringify({event:'oauth.callback_code_missing',...diagnostic,code:'OAUTH_CODE_MISSING'}));destination.searchParams.set('error','OAUTH_CODE_MISSING');return destination.toString();}
  try{console.info(JSON.stringify({event:'oauth.provider_exchange_started',...diagnostic,stage:'token_exchange'}));const identity=await providerIdentity(provider,code,a.provider_verifier,correlationId);console.info(JSON.stringify({event:'oauth.identity_received',...diagnostic}));destination.searchParams.set('ticket',await repo.saveCallback(state as string,identity));console.info(JSON.stringify({event:'oauth.ticket_persisted',...diagnostic}));}
  catch(cause){const stage=cause instanceof AppError&&cause.code==='OAUTH_PROVIDER_ERROR'?'provider_exchange_or_profile':'callback_persistence';console.error(JSON.stringify({event:'oauth.callback_failed',...diagnostic,stage,code:cause instanceof AppError?cause.code:'INTERNAL_ERROR'}));destination.searchParams.set('error',stage==='callback_persistence'?'OAUTH_CALLBACK_FAILED':'OAUTH_PROVIDER_ERROR');}
  return destination.toString();
}
/** Exige prueba del dispositivo para vincular o iniciar sesión; una identidad nueva solicita completar el alta. */
// Función exchangeOAuth: concentra la lógica dentro de este módulo.
export async function exchangeOAuth(value:unknown){
  const body=object(value);let provider:OAuthProvider|undefined;let stage='ticket_validation';console.info(JSON.stringify({event:'oauth.exchange_started'}));let result;
  try{result=await repo.withTicket(body.ticket,body.proof,async(c,a)=>{
    provider=a.provider;stage='account_lookup';
    const [accounts]=await c.execute<RowDataPacket[]>('SELECT user_id FROM oauth_accounts WHERE provider=? AND subject=?',[a.provider,a.identity_json.subject]);
    const action=oauthExchangeAction(accounts[0]?String(accounts[0].user_id):null,a.link_user_id);
    if(action==='conflict')throw new AppError('OAUTH_ACCOUNT_CONFLICT',409,'Esta identidad ya pertenece a otra cuenta.');
    if(action==='link'){
      stage='account_link';
      const [users]=await c.execute<RowDataPacket[]>('SELECT is_active,email_verified_at,session_version FROM users WHERE id=? FOR UPDATE',[a.link_user_id]);
      if(!users[0]?.is_active||!users[0]?.email_verified_at||Number(users[0].session_version)!==a.link_session_version)throw new AppError('INVALID_TOKEN',401,'La sesión de vinculación fue revocada.');
      // El consentimiento abierto no debe vincular una identidad después de cerrar la sesión que lo inició.
      const [families]=await c.execute<RowDataPacket[]>('SELECT 1 FROM refresh_tokens WHERE family_id=? AND user_id=? AND revoked_at IS NULL AND expires_at>UTC_TIMESTAMP(3) LIMIT 1',[a.link_family_id,a.link_user_id]);
      if(!families.length)throw new AppError('INVALID_TOKEN',401,'La sesión de vinculación fue revocada.');
      if(!accounts[0])await c.execute('INSERT INTO oauth_accounts(provider,subject,user_id) VALUES (?,?,?)',[a.provider,a.identity_json.subject,a.link_user_id]);await repo.consume(c,body.ticket as string);console.info(JSON.stringify({event:'oauth.account_linked',provider}));return {linked:true as const};
    }
    if(action==='register'){console.info(JSON.stringify({event:'oauth.registration_required',provider}));return {registrationRequired:true as const,email:a.identity_json.email,name:a.identity_json.name};}
    await repo.consume(c,body.ticket as string);return {userId:String(accounts[0].user_id)};
  });}catch(error){console.warn(JSON.stringify({event:'oauth.exchange_failed',provider:provider??'unknown',stage,code:error instanceof AppError?error.code:'INTERNAL_ERROR'}));throw error;}
  if(!('userId' in result)){console.info(JSON.stringify({event:'oauth.exchange_completed',provider,result:'registration_or_link'}));return result;}stage='user_lookup';const user=await findUserById(result.userId!);
  if(!user||!user.isActive)throw new AppError('INVALID_CREDENTIALS',401,'La cuenta no está habilitada.');
  if(!user.emailVerifiedAt){stage='email_verification';throw new AppError('EMAIL_NOT_VERIFIED',403,'Verificá tu correo para continuar.',await createVerificationProof(user.id));}stage='session_creation';const session=await sessionForUser(user);console.info(JSON.stringify({event:'oauth.session_created',provider}));return {session};
}
/** No fusionar por email. El alta exige contraseña propia y código SMTP, también para X. */
// Función registerOAuth: crea un registro o inicia una operación dentro de este módulo.
export async function registerOAuth(value:unknown){
  const body=object(value),input=validateRegister(body.profile);getMailConfiguration();getVerificationSecret();
  assertOAuthRegistrationEmailAvailable(Boolean(await findUserByEmail(input.email)));
  const hash=await hashPassword(input.password),proof=randomBytes(32).toString('hex');
  await repo.withTicket(body.ticket,body.proof,async(c,a)=>{
    if(a.link_user_id)throw new AppError('VALIDATION_ERROR',400,'Esta solicitud es de vinculación.');const [roles]=await c.execute<RowDataPacket[]>("SELECT id FROM roles WHERE code='CLIENT'");if(!roles[0])throw new AppError('AUTH_UNAVAILABLE',503,'El rol cliente no está configurado.');
    await c.execute('INSERT INTO users(role_id,email,password_hash,first_name,last_name,phone) VALUES (?,?,?,?,?,?)',[roles[0].id,input.email,hash,input.firstName,input.lastName,input.phone]);const [ids]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');const id=ids[0].id;
    await c.execute('INSERT INTO oauth_accounts(provider,subject,user_id) VALUES (?,?,?)',[a.provider,a.identity_json.subject,id]);
    await c.execute("INSERT INTO email_verifications(user_id,token_hash,proof_expires_at,send_window_started_at,next_send_at,delivery) VALUES (?,?,TIMESTAMPADD(HOUR,24,UTC_TIMESTAMP(3)),UTC_TIMESTAMP(3),UTC_TIMESTAMP(3),'failed')",[id,hashVerificationToken(proof)]);await repo.consume(c,body.ticket as string);
  });return {verification:await resendVerification({verificationToken:proof})};
}
