import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { databasePool } from '../config/database';
import { getMailConfiguration } from '../config/mail';
import { env } from '../config/env';
import { AppError } from '../utils/app-error';
import { normalizeEmail, readPassword } from '../validators/auth.validator';
import { hashPassword } from './password.service';
import { sendPasswordResetEmail } from './mail.service';

const tokenHash = (token: string) => createHash('sha256').update(token).digest('hex');
const resetUrl = () => {
  const value = process.env.PASSWORD_RESET_URL?.trim();
  try { const url = new URL(value ?? ''); const localHost=['localhost','127.0.0.1','::1'].includes(url.hostname);
    if ((url.protocol!=='https:'&&!(env.nodeEnvironment!=='production'&&localHost&&url.protocol==='http:')) || url.username || url.password || url.search || url.hash) throw new Error();
    return url.toString(); }
  catch { throw new AppError('PASSWORD_RESET_UNAVAILABLE', 503, 'La recuperación de contraseña no está configurada.'); }
};

export async function requestPasswordReset(body: unknown): Promise<void> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => key !== 'email')) throw new AppError('VALIDATION_ERROR',400,'Ingresá un correo válido.');
  const email = normalizeEmail((body as { email?: unknown }).email);
  const baseUrl = resetUrl();
  getMailConfiguration();
  const connection=await databasePool.getConnection();
  let token:string|undefined;
  try {
    await connection.beginTransaction();
    const [users]=await connection.execute<Array<{id:string;email:string;is_active:number;email_verified_at:string|null} & import('mysql2/promise').RowDataPacket>>(
      'SELECT CAST(id AS CHAR) AS id,email,is_active,email_verified_at FROM users WHERE email=? FOR UPDATE',[email]);
    const user=users[0];
    if(!user||user.is_active!==1||!user.email_verified_at){await connection.commit();return;}
    token=randomBytes(32).toString('hex');
    await connection.execute('UPDATE password_resets SET used_at=UTC_TIMESTAMP(3) WHERE user_id=? AND used_at IS NULL',[user.id]);
    await connection.execute('INSERT INTO password_resets (user_id,token_hash,expires_at) VALUES (?,?,TIMESTAMPADD(MINUTE,30,UTC_TIMESTAMP(3)))',[user.id,tokenHash(token)]);
    await connection.commit();
  } catch(error){await connection.rollback();throw error;}
  finally{connection.release();}
  if(!token)return;
  const url = new URL(baseUrl);
  url.searchParams.set('token',token);
  await sendPasswordResetEmail(email,url.toString());
}

export async function resetPassword(body: unknown): Promise<void> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['token','password'].includes(key))) throw new AppError('VALIDATION_ERROR',400,'El enlace no es válido o venció.');
  const input = body as { token?: unknown; password?: unknown };
  if (typeof input.token !== 'string' || !/^[a-f0-9]{64}$/.test(input.token)) throw new AppError('PASSWORD_RESET_INVALID',400,'El enlace no es válido o venció.');
  const password = readPassword(input.password,true);
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<Array<{id:string;user_id:string} & import('mysql2').RowDataPacket>>(
      'SELECT id,CAST(user_id AS CHAR) AS user_id FROM password_resets WHERE token_hash=? AND used_at IS NULL AND expires_at>UTC_TIMESTAMP(3) FOR UPDATE',[tokenHash(input.token)]);
    if (!rows[0]) throw new AppError('PASSWORD_RESET_INVALID',400,'El enlace no es válido, venció o ya se utilizó.');
    const hash = await hashPassword(password);
    const [updated]=await connection.execute('UPDATE users SET password_hash=?,must_change_password=0,session_version=session_version+1 WHERE id=?',[hash,rows[0].user_id]);
    if((updated as import('mysql2/promise').ResultSetHeader).affectedRows!==1)throw new AppError('PASSWORD_RESET_INVALID',400,'El enlace no es valido o vencio.');
    await connection.execute('UPDATE password_resets SET used_at=UTC_TIMESTAMP(3) WHERE user_id=? AND used_at IS NULL',[rows[0].user_id]);
    await connection.commit();
  } catch(error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

/** Establece la primera contraseña propia tras verificar el correo de una cuenta de empleado. */
export async function changeInitialPassword(body: unknown): Promise<void> {
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).some(key => !['email','currentPassword','newPassword'].includes(key))) throw new AppError('VALIDATION_ERROR',400,'Revisá los datos ingresados.');
  const value=body as {email?:unknown;currentPassword?:unknown;newPassword?:unknown};
  const email=normalizeEmail(value.email);const currentPassword=readPassword(value.currentPassword,false);const newPassword=readPassword(value.newPassword,true);
  const connection=await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [users]=await connection.execute<Array<{id:string;password_hash:string;is_active:number;email_verified_at:string|null;must_change_password:number}&import('mysql2').RowDataPacket>>(
      'SELECT CAST(id AS CHAR) AS id,password_hash,is_active,email_verified_at,must_change_password FROM users WHERE email=? FOR UPDATE',[email]);
    const user=users[0];
    if(!user||user.is_active!==1||!await bcrypt.compare(currentPassword,user.password_hash))throw new AppError('INVALID_CREDENTIALS',401,'Correo electrónico o contraseña incorrectos.');
    if(!user.email_verified_at)throw new AppError('EMAIL_NOT_VERIFIED',403,'Primero verificá el correo desde el código enviado.');
    if(Number(user.must_change_password)!==1)throw new AppError('PASSWORD_CHANGE_NOT_REQUIRED',409,'La cuenta ya tiene una contraseña propia. Iniciá sesión.');
    if(currentPassword===newPassword)throw new AppError('VALIDATION_ERROR',400,'Elegí una contraseña distinta a la inicial.');
    const hash=await hashPassword(newPassword);
    await connection.execute('UPDATE users SET password_hash=?,must_change_password=0,session_version=session_version+1 WHERE id=?',[hash,user.id]);
    await connection.commit();
  } catch(error){await connection.rollback();throw error;} finally{connection.release();}
}
