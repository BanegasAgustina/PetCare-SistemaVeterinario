/** Coordina OAuth, vínculo explícito y alta con email verificado. MySQL decide el rol. */
import { createHash,randomBytes } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { oauthConfig,oauthConfigured,oauthReturnUrl,type OAuthProvider } from '../config/oauth';
import * as repo from '../repositories/oauth.repository';
import { authorizationUrl,providerIdentity } from './oauth-provider.service';
import { findUserById,findUserByEmail } from '../repositories/user.repository';
import { sessionForUser } from './session.service';
import { validateRegister } from '../validators/auth.validator';
import { hashPassword } from './password.service';
import { createVerificationProof,resendVerification,hashVerificationToken } from './verification.service';
import { getMailConfiguration,getVerificationSecret } from '../config/mail';
import { AppError } from '../utils/app-error';
function object(value:unknown):Record<string,unknown>{if(!value||typeof value!=='object'||Array.isArray(value))throw new AppError('VALIDATION_ERROR',400,'La solicitud debe ser JSON.');return value as Record<string,unknown>;}
/** Guarda state aleatorio, PKCE del proveedor y prueba del dispositivo en un intento limitado a diez minutos. */
export async function startOAuth(provider:OAuthProvider,value:unknown,linkId?:string,linkFamily?:string){
  const body=object(value);if(!oauthConfigured(provider))return {configured:false as const};oauthConfig(provider);if(typeof body.challenge!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(body.challenge))throw new AppError('VALIDATION_ERROR',400,'La prueba OAuth no es válida.');
  const returnUrl=oauthReturnUrl(body.returnUrl),user=linkId?await findUserById(linkId):null;
  if(linkId&&(!user||!user.isActive||!user.emailVerifiedAt||!linkFamily))throw new AppError('INVALID_TOKEN',401,'Volvé a iniciar sesión antes de vincular un proveedor.');
  const a=await repo.createAttempt(provider,body.challenge,returnUrl,user?{id:user.id,version:user.sessionVersion,family:linkFamily!}:undefined);return {configured:true as const,url:authorizationUrl(provider,a.state,createHash('sha256').update(a.verifier).digest('base64url'))};
}
/** Reclama state una sola vez y devuelve un ticket breve; nunca redirige access/refresh tokens. */
export async function callbackOAuth(provider:OAuthProvider,state:unknown,code:unknown,error:unknown):Promise<string>{
  const a=await repo.claimCallback(provider,state),destination=new URL(a.return_url);
  try{if(error||typeof code!=='string'||!code||code.length>4096)throw new Error();destination.searchParams.set('ticket',await repo.saveCallback(state as string,await providerIdentity(provider,code,a.provider_verifier)));}catch{destination.searchParams.set('error','OAUTH_FAILED');}return destination.toString();
}
/** Exige prueba del dispositivo para vincular o iniciar sesión; una identidad nueva solicita completar el alta. */
export async function exchangeOAuth(value:unknown){
  const body=object(value);const result=await repo.withTicket(body.ticket,body.proof,async(c,a)=>{
    const [accounts]=await c.execute<RowDataPacket[]>('SELECT user_id FROM oauth_accounts WHERE provider=? AND subject=?',[a.provider,a.identity_json.subject]);
    if(a.link_user_id){
      const [users]=await c.execute<RowDataPacket[]>('SELECT is_active,email_verified_at,session_version FROM users WHERE id=? FOR UPDATE',[a.link_user_id]);
      if(!users[0]?.is_active||!users[0]?.email_verified_at||Number(users[0].session_version)!==a.link_session_version)throw new AppError('INVALID_TOKEN',401,'La sesión de vinculación fue revocada.');
      // El consentimiento abierto no debe vincular una identidad después de cerrar la sesión que lo inició.
      const [families]=await c.execute<RowDataPacket[]>('SELECT 1 FROM refresh_tokens WHERE family_id=? AND user_id=? AND revoked_at IS NULL AND expires_at>UTC_TIMESTAMP(3) LIMIT 1',[a.link_family_id,a.link_user_id]);
      if(!families.length)throw new AppError('INVALID_TOKEN',401,'La sesión de vinculación fue revocada.');
      if(accounts[0]&&String(accounts[0].user_id)!==String(a.link_user_id))throw new AppError('OAUTH_ACCOUNT_CONFLICT',409,'Esta identidad ya pertenece a otra cuenta.');
      if(!accounts[0])await c.execute('INSERT INTO oauth_accounts(provider,subject,user_id) VALUES (?,?,?)',[a.provider,a.identity_json.subject,a.link_user_id]);await repo.consume(c,body.ticket as string);return {linked:true as const};
    }
    if(!accounts[0])return {registrationRequired:true as const,email:a.identity_json.email,name:a.identity_json.name};
    await repo.consume(c,body.ticket as string);return {userId:String(accounts[0].user_id)};
  });
  if(!('userId' in result))return result;const user=await findUserById(result.userId!);
  if(!user||!user.isActive)throw new AppError('INVALID_CREDENTIALS',401,'La cuenta no está habilitada.');
  if(!user.emailVerifiedAt)throw new AppError('EMAIL_NOT_VERIFIED',403,'Verificá tu correo para continuar.',await createVerificationProof(user.id));return {session:await sessionForUser(user)};
}
/** No fusionar por email. El alta exige contraseña propia y código SMTP, también para X. */
export async function registerOAuth(value:unknown){
  const body=object(value),input=validateRegister(body.profile);getMailConfiguration();getVerificationSecret();
  if(await findUserByEmail(input.email))throw new AppError('OAUTH_LINK_REQUIRED',409,'Ese email ya tiene una cuenta. Iniciá sesión con contraseña y vinculá el proveedor desde Mi cuenta.');
  const hash=await hashPassword(input.password),proof=randomBytes(32).toString('hex');
  await repo.withTicket(body.ticket,body.proof,async(c,a)=>{
    if(a.link_user_id)throw new AppError('VALIDATION_ERROR',400,'Esta solicitud es de vinculación.');const [roles]=await c.execute<RowDataPacket[]>("SELECT id FROM roles WHERE code='CLIENT'");if(!roles[0])throw new AppError('AUTH_UNAVAILABLE',503,'El rol cliente no está configurado.');
    await c.execute('INSERT INTO users(role_id,email,password_hash,first_name,last_name,phone) VALUES (?,?,?,?,?,?)',[roles[0].id,input.email,hash,input.firstName,input.lastName,input.phone]);const [ids]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');const id=ids[0].id;
    await c.execute('INSERT INTO oauth_accounts(provider,subject,user_id) VALUES (?,?,?)',[a.provider,a.identity_json.subject,id]);
    await c.execute("INSERT INTO email_verifications(user_id,token_hash,proof_expires_at,send_window_started_at,next_send_at,delivery) VALUES (?,?,TIMESTAMPADD(HOUR,24,UTC_TIMESTAMP(3)),UTC_TIMESTAMP(3),UTC_TIMESTAMP(3),'failed')",[id,hashVerificationToken(proof)]);await repo.consume(c,body.ticket as string);
  });return {verification:await resendVerification({verificationToken:proof})};
}
