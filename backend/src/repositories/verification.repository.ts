/** Estado persistido y bloqueado por usuario: serializa verificación/reenvío entre procesos. */
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';

export type VerificationRow = RowDataPacket & {
  user_id: string; email: string; is_active: number; email_verified_at: string | null;
  token_hash: string; code_hash: string | null; expires_at: string | null;
  attempts: number; send_count: number; delivery: 'sent' | 'failed' | 'pending'; consumed_at: string | null;
  proof_expired: number; code_expired: number; retry_seconds: number; window_expired: number; window_seconds: number;
};
export async function findVerificationUser(tokenHash: string): Promise<string> {
  return runDatabaseOperation(async () => {
    const [rows] = await databasePool.execute<RowDataPacket[]>('SELECT CAST(user_id AS CHAR) AS id FROM email_verifications WHERE token_hash = ?', [tokenHash]);
    if (!rows[0]) throw new AppError('VERIFICATION_SESSION_EXPIRED', 401, 'Volvé a iniciar sesión para retomar la verificación.');
    return rows[0].id as string;
  });
}

/** Orden fijo de locks (usuario, desafío) evita carreras y el consumo simultáneo del código. */
export async function withVerificationUser<T>(id: string, operation: (connection: PoolConnection, user: RowDataPacket) => Promise<T>): Promise<T> {
  return runDatabaseOperation(async () => {
    const connection = await databasePool.getConnection();
    try {
      await connection.beginTransaction();
      const [users] = await connection.execute<RowDataPacket[]>('SELECT id, email, is_active, email_verified_at FROM users WHERE id = ? FOR UPDATE', [id]);
      if (!users[0] || users[0].is_active !== 1) throw new AppError('VERIFICATION_SESSION_EXPIRED', 401, 'La solicitud de verificación no es válida.');
      const result = await operation(connection, users[0]);
      await connection.commit();
      return result;
    } catch (error) { await connection.rollback(); throw error; }
    finally { connection.release(); }
  });
}

export async function readVerification(connection: PoolConnection, id: string): Promise<VerificationRow | null> {
  const [rows] = await connection.execute<VerificationRow[]>(`SELECT v.*, u.email, u.is_active, u.email_verified_at,
    v.proof_expires_at <= UTC_TIMESTAMP(3) AS proof_expired,
    (v.expires_at IS NULL OR v.expires_at <= UTC_TIMESTAMP(3)) AS code_expired,
    GREATEST(0, CEIL(TIMESTAMPDIFF(MICROSECOND, UTC_TIMESTAMP(3), v.next_send_at) / 1000000)) AS retry_seconds,
    v.send_window_started_at <= TIMESTAMPADD(HOUR, -1, UTC_TIMESTAMP(3)) AS window_expired,
    GREATEST(0, CEIL(TIMESTAMPDIFF(MICROSECOND, UTC_TIMESTAMP(3), TIMESTAMPADD(HOUR, 1, v.send_window_started_at)) / 1000000)) AS window_seconds
    FROM email_verifications v JOIN users u ON u.id = v.user_id WHERE v.user_id = ? FOR UPDATE`, [id]);
  return rows[0] ?? null;
}
