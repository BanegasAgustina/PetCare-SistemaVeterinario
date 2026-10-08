/** Guarda solo hashes de renovación. Los locks serializan rotación, replay y revocación. */
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
export const digest = (value: string) => createHash('sha256').update(value).digest('hex');
export function opaqueToken(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new AppError('INVALID_TOKEN',401,'La sesión no es válida.');
  return value;
}
export function refreshLifetime(): number {
  const seconds = Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2592000);
  if (!Number.isInteger(seconds) || seconds < 3600 || seconds > 7776000) throw new AppError('AUTH_UNAVAILABLE',503,'La renovación no está configurada.');
  return seconds;
}
export async function issueRefresh(userId: string, version: number): Promise<string> {
  const token = randomBytes(32).toString('hex');
  await runDatabaseOperation(()=>databasePool.execute('INSERT INTO refresh_tokens(token_hash,family_id,user_id,session_version,expires_at) VALUES (?,?,?,?,TIMESTAMPADD(SECOND,?,UTC_TIMESTAMP(3)))',[digest(token),randomUUID(),userId,version,refreshLifetime()]));
  return token;
}
/** El JWT referencia la familia, no el secreto. Logout/replay invalidan también sus access tokens. */
export async function refreshFamily(token:string):Promise<string>{
  return runDatabaseOperation(async()=>{const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT family_id FROM refresh_tokens WHERE token_hash=?',[digest(token)]);if(!rows[0])throw new AppError('INVALID_TOKEN',401,'La sesión no es válida.');return String(rows[0].family_id);});
}
export async function activeFamily(family:string,userId:string):Promise<boolean>{
  return runDatabaseOperation(async()=>{const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT 1 FROM refresh_tokens WHERE family_id=? AND user_id=? AND revoked_at IS NULL AND expires_at>UTC_TIMESTAMP(3) LIMIT 1',[family,userId]);return rows.length>0;});
}
/** Un token ya consumido revoca su familia; no se lanza el error hasta confirmar la revocación. */
export async function rotateRefresh(value: unknown): Promise<{ userId: string; version: number; token: string }> {
  const token = opaqueToken(value);
  const result = await runDatabaseOperation(async()=>{
    const c = await databasePool.getConnection();
    try {
      // Usuario primero, igual que los cambios administrativos de contraseña.
      const [lookup] = await c.execute<RowDataPacket[]>('SELECT user_id FROM refresh_tokens WHERE token_hash=?',[digest(token)]);
      if (!lookup[0]) return null;
      await c.beginTransaction();
      const [users] = await c.execute<RowDataPacket[]>('SELECT is_active,email_verified_at,session_version FROM users WHERE id=? FOR UPDATE',[lookup[0].user_id]);
      const [rows] = await c.execute<RowDataPacket[]>('SELECT *,expires_at<=UTC_TIMESTAMP(3) AS expired FROM refresh_tokens WHERE token_hash=? FOR UPDATE',[digest(token)]);
      const row=rows[0], user=users[0];
      if (!row || !user) { await c.rollback(); return null; }
      if (row.consumed_at || row.revoked_at || row.expired || !user.is_active || !user.email_verified_at || user.session_version !== row.session_version) {
        await c.execute('UPDATE refresh_tokens SET revoked_at=COALESCE(revoked_at,UTC_TIMESTAMP(3)) WHERE family_id=?',[row.family_id]);
        await c.commit(); return null;
      }
      const next = randomBytes(32).toString('hex');
      await c.execute('UPDATE refresh_tokens SET consumed_at=UTC_TIMESTAMP(3) WHERE token_hash=?',[digest(token)]);
      // Caducidad absoluta de familia: renovar no prolonga indefinidamente la sesión.
      await c.execute('INSERT INTO refresh_tokens(token_hash,family_id,user_id,session_version,expires_at) VALUES (?,?,?,?,?)',[digest(next),row.family_id,row.user_id,row.session_version,row.expires_at]);
      await c.commit();return {userId:String(row.user_id),version:Number(row.session_version),token:next};
    } catch(error) { await c.rollback();throw error; } finally { c.release(); }
  });
  if (!result) throw new AppError('INVALID_TOKEN',401,'La sesión venció o fue revocada. Iniciá sesión nuevamente.');
  return result;
}
/** Logout revoca la familia identificada por el secreto, sin aceptar un userId del frontend. */
export async function revokeRefresh(value: unknown): Promise<void> {
  const token=opaqueToken(value);
  await runDatabaseOperation(async()=>{
    const c=await databasePool.getConnection();
    try {
      const [rows]=await c.execute<RowDataPacket[]>('SELECT user_id,family_id FROM refresh_tokens WHERE token_hash=?',[digest(token)]);
      if (!rows[0]) return;
      await c.beginTransaction();
      await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[rows[0].user_id]);
      await c.execute('UPDATE refresh_tokens SET revoked_at=COALESCE(revoked_at,UTC_TIMESTAMP(3)) WHERE family_id=?',[rows[0].family_id]);
      await c.commit();
    } catch(error) {await c.rollback();throw error;} finally {c.release();}
  });
}
