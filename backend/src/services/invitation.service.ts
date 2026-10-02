/** Invitación y restablecimiento: 256 bits aleatorios, SHA-256 en MySQL, un uso y 24 h.
 * El token prueba posesión del correo; no es un JWT ni permite usar endpoints de la cuenta.
 * Los locks y la versión de sesión impiden replay y revocan sesiones previas al cambiar contraseña.
 */
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { env } from '../config/env';
import { getMailConfiguration } from '../config/mail';
import { sendInvitationEmail } from './mail.service';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
import { validateInvitation } from '../validators/veterinarian.validator';

export function invitationUrl(): URL {
  getMailConfiguration();
  try {
    const url = new URL(process.env.VETERINARIAN_INVITATION_URL ?? '');
    const local = env.nodeEnvironment !== 'production' && ['localhost','127.0.0.1'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new Error();
    return url;
  } catch { throw new AppError('INVITATION_UNAVAILABLE',503,'Configurá la URL segura de activación de veterinarios.'); }
}
export function tokenHash(token: string) { return createHash('sha256').update(token).digest('hex'); }
export async function saveInvitation(connection: PoolConnection,userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await connection.execute(`INSERT INTO veterinarian_invitations (user_id,token_hash,expires_at,sent_at)
    VALUES (?,?,TIMESTAMPADD(HOUR,24,UTC_TIMESTAMP(3)),UTC_TIMESTAMP(3))
    ON DUPLICATE KEY UPDATE token_hash=VALUES(token_hash),expires_at=VALUES(expires_at),consumed_at=NULL,sent_at=VALUES(sent_at),delivery='pending'`,[userId,tokenHash(token)]);
  return token;
}
export async function deliverInvitation(email: string,token: string): Promise<'sent' | 'failed'> {
  const url = invitationUrl();
  // Fragmento: evita incluir el secreto en logs HTTP del servidor web. La pantalla lo lee en el dispositivo.
  url.hash = `token=${token}`;
  let delivery:'sent'|'failed';
  try { await sendInvitationEmail(email,url.toString()); delivery='sent'; }
  catch { delivery='failed'; }
  // Un envío lento de un token viejo no puede cambiar el estado de una invitación rotada.
  await runDatabaseOperation(async()=>{await databasePool.execute('UPDATE veterinarian_invitations SET delivery=? WHERE token_hash=?',[delivery,tokenHash(token)]);});
  return delivery;
}
export async function renewInvitation(vetId: string): Promise<{ delivery: 'sent' | 'failed' }> {
  invitationUrl();
  const invitation = await runDatabaseOperation(async () => {
    const connection = await databasePool.getConnection();
    try {
      await connection.beginTransaction();
      const [users] = await connection.execute<RowDataPacket[]>(`SELECT u.id,u.email,u.is_active FROM users u
        JOIN veterinarians v ON v.user_id=u.id JOIN roles r ON r.id=u.role_id WHERE v.id=? AND r.code='VETERINARIAN' FOR UPDATE`,[vetId]);
      if (!users[0]) throw new AppError('NOT_FOUND',404,'Veterinario no encontrado.');
      if (!users[0].is_active) throw new AppError('ACCOUNT_INACTIVE',409,'Activá la cuenta antes de enviar una invitación.');
      const [rows] = await connection.execute<RowDataPacket[]>('SELECT sent_at > TIMESTAMPADD(SECOND,-60,UTC_TIMESTAMP(3)) AS cooldown FROM veterinarian_invitations WHERE user_id=? FOR UPDATE',[users[0].id]);
      if (rows[0]?.cooldown) throw new AppError('INVITATION_COOLDOWN',429,'Esperá un minuto antes de reenviar.');
      const token = await saveInvitation(connection,String(users[0].id));
      await connection.commit(); return { token,email: users[0].email as string };
    } catch(error) { await connection.rollback(); throw error; } finally { connection.release(); }
  });
  return { delivery: await deliverInvitation(invitation.email,invitation.token) };
}
export async function acceptInvitation(value: unknown): Promise<void> {
  const input = validateInvitation(value);
  const hash = await bcrypt.hash(input.password,env.bcryptSaltRounds);
  await runDatabaseOperation(async () => {
    const connection = await databasePool.getConnection();
    try {
      await connection.beginTransaction();
      const [lookup] = await connection.execute<RowDataPacket[]>('SELECT user_id FROM veterinarian_invitations WHERE token_hash=?',[tokenHash(input.token)]);
      const invalid = () => new AppError('INVALID_INVITATION',400,'La invitación no es válida o venció.');
      if (!lookup[0]) throw invalid();
      // Orden de locks consistente con edición/reenviar: primero users, después invitation.
      const [users] = await connection.execute<RowDataPacket[]>(`SELECT u.id,u.is_active FROM users u JOIN roles r ON r.id=u.role_id
        JOIN veterinarians v ON v.user_id=u.id WHERE u.id=? AND r.code='VETERINARIAN' FOR UPDATE`,[lookup[0].user_id]);
      if (!users[0]?.is_active) throw invalid();
      const [rows] = await connection.execute<RowDataPacket[]>(`SELECT user_id FROM veterinarian_invitations
        WHERE user_id=? AND token_hash=? AND consumed_at IS NULL AND expires_at>UTC_TIMESTAMP(3) FOR UPDATE`,[users[0].id,tokenHash(input.token)]);
      if (!rows[0]) throw invalid();
      await connection.execute('UPDATE users SET password_hash=?,email_verified_at=UTC_TIMESTAMP(3),session_version=session_version+1 WHERE id=?',[hash,users[0].id]);
      await connection.execute('UPDATE veterinarian_invitations SET consumed_at=UTC_TIMESTAMP(3) WHERE user_id=?',[users[0].id]);
      // Cualquier prueba de verificación previa deja de ser útil después de configurar la contraseña.
      await connection.execute('DELETE FROM email_verifications WHERE user_id=?',[users[0].id]);
      await connection.commit();
    } catch(error) { await connection.rollback(); throw error; } finally { connection.release(); }
  });
}
