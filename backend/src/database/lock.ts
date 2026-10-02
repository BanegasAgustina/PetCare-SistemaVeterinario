/** Serializa migraciones y seeds en la misma base, incluso entre procesos distintos. */
import { createHash } from 'node:crypto';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env';
import { DatabaseError } from '../utils/database-error';

export async function withDatabaseLock<T>(connection: PoolConnection, operation: () => Promise<T>): Promise<T> {
  // MySQL limita nombres de locks a 64 caracteres; el hash evita nombres extensos.
  const lockName = `petcare:${createHash('sha256').update(env.database.database).digest('hex').slice(0, 48)}`;
  const [rows] = await connection.execute<(RowDataPacket & { acquired: number | string | null })[]>('SELECT GET_LOCK(?, ?) AS acquired', [lockName, 15]);
  // mysql2 puede devolver el resultado entero como string al proteger los BIGINT.
  if (Number(rows[0]?.acquired) !== 1) throw new DatabaseError('DB_LOCK_UNAVAILABLE', 503, 'Otro proceso está preparando la base. Intentá nuevamente.');
  try { return await operation(); }
  finally { await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]); }
}
