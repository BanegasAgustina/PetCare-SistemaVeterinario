/**
 * ARCHIVO: lock.ts
 * UBICACIÓN: backend/src/database/lock.ts
 * FUNCIÓN: Bloqueo de MySQL con nombre para serializar tareas de mantenimiento.
 * RESPONSABILIDAD: Adquiere GET_LOCK, ejecuta callback y libera el bloqueo aun cuando hay excepción.
 * CONEXIONES: Importa: backend/src/config/env.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/database/appointment-details-migrate.ts, backend/src/database/auth-migrate.ts, backend/src/database/availability-archive-migrate.ts, backend/src/database/bootstrap.ts, backend/src/database/client-migrate.ts, backend/src/database/client-reference-seed.ts, backend/src/database/clinic-migrate.ts, backend/src/database/clinic-reconcile.ts y 18 más
 * FUNCIONAMIENTO: Bootstrap y scripts de migración → withDatabaseLock → conexión MySQL.
 * IMPORTANCIA: Evita dos procesos simultáneos de preparación sobre la misma base.
 */
/** Serializa migraciones y seeds en la misma base, incluso entre procesos distintos. */
import { createHash } from 'node:crypto';
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { env } from '../config/env';
import { DatabaseError } from '../utils/database-error';

/** Adquiere un lock MySQL nombrado, ejecuta callback y lo libera en finally. */
export async function withDatabaseLock<T>(connection: PoolConnection, operation: () => Promise<T>): Promise<T> {
  // MySQL limita nombres de locks a 64 caracteres; el hash evita nombres extensos.
  const lockName = `petcare:${createHash('sha256').update(env.database.database).digest('hex').slice(0, 48)}`;
  const [rows] = await connection.execute<(RowDataPacket & { acquired: number | string | null })[]>('SELECT GET_LOCK(?, ?) AS acquired', [lockName, 15]);
  // mysql2 puede devolver el resultado entero como string al proteger los BIGINT.
  if (Number(rows[0]?.acquired) !== 1) throw new DatabaseError('DB_LOCK_UNAVAILABLE', 503, 'Otro proceso está preparando la base. Intentá nuevamente.');
  try { return await operation(); }
  finally { await connection.execute('SELECT RELEASE_LOCK(?)', [lockName]); }
}
