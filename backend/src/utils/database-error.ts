/**
 * ARCHIVO: database-error.ts
 * UBICACIÓN: backend/src/utils/database-error.ts
 * FUNCIÓN: Normaliza errores del driver de base a códigos de aplicación.
 * RESPONSABILIDAD: Traducir duplicados, restricciones, conectividad y errores inesperados sin filtrar SQL al usuario.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/clinic.controller.ts, backend/src/database/cli.ts, backend/src/database/create-database.ts, backend/src/database/lock.ts, backend/src/database/migration-files.ts, backend/src/database/migration-runner.ts, backend/src/database/promote-super-admin.ts, backend/src/database/seed-runner.ts y 22 más
 * FUNCIONAMIENTO: Clasifica códigos del driver, convierte a DatabaseError y ejecuta operaciones capturando fallos.
 * IMPORTANCIA: Centraliza manejo de SQL para que los controladores reciban errores seguros.
 */
/** Convierte errores MySQL en errores públicos seguros; nunca publica sqlMessage/sql. */
import { AppError } from './app-error';
/** Error normalizado de almacenamiento con código seguro, estado HTTP y causa interna. */
export class DatabaseError extends Error {
  /** Crea un error de base de datos con estado HTTP y causa original para el manejo centralizado. */
  constructor(public readonly code: string, public readonly status: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'DatabaseError';
  }
}

/** Códigos del driver que indican que la base o el pool no está disponible. */
const unavailableCodes = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'EACCES',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR', 'PROTOCOL_ENQUEUE_AFTER_QUIT',
  'ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR',
  'ER_CON_COUNT_ERROR', 'ER_SERVER_SHUTDOWN', 'ER_SERVER_OFFLINE_MODE', 'POOL_ENQUEUELIMIT',
]);

/** Clasifica error del driver en código seguro y contexto para capa superior. */
export function normalizeDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) return error;
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (unavailableCodes.has(code)) {
    console.error('[DATABASE_UNAVAILABLE]', JSON.stringify({ code }));
    return new DatabaseError('DB_UNAVAILABLE', 503, 'La base de datos no está disponible. Intentá nuevamente.', error);
  }
  if (['ER_NO_SUCH_TABLE','ER_BAD_FIELD_ERROR','ER_UNKNOWN_COLLATION','ER_COLLATION_CHARSET_MISMATCH'].includes(code)) {
    const message = typeof error === 'object' && error !== null && 'sqlMessage' in error ? String(error.sqlMessage) : '';
    const object = /(?:Table|Unknown column)\s+['`]?([A-Za-z0-9_$]+(?:\.[A-Za-z0-9_$]+)?)['`]?/i.exec(message)?.[1];
    // Registrar solo el código y el identificador validado: nunca SQL, valores ni sqlMessage completo.
    console.error('[DATABASE_SCHEMA_ERROR]', JSON.stringify({ code, ...(object ? { object } : {}) }));
    return new DatabaseError('SCHEMA_UPDATE_REQUIRED',500,'No pudimos recuperar los datos de la clínica. El esquema de la base requiere una actualización.',error);
  }
  if (code === 'ER_DUP_ENTRY') return new DatabaseError('DB_CONFLICT', 409, 'Ya existe un registro con esos datos únicos.', error);
  if (['ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2'].includes(code)) {
    return new DatabaseError('DB_RELATION_CONFLICT', 409, 'La operación no respeta las relaciones entre los registros.', error);
  }
  if (['ER_CHECK_CONSTRAINT_VIOLATED', 'ER_BAD_NULL_ERROR', 'ER_DATA_TOO_LONG', 'ER_TRUNCATED_WRONG_VALUE', 'WARN_DATA_TRUNCATED'].includes(code)) {
    return new DatabaseError('DB_INVALID_DATA', 400, 'Los datos no cumplen los requisitos de la base de datos.', error);
  }
  console.error('[DATABASE_OPERATION_ERROR]', JSON.stringify({ code: /^[A-Z0-9_]+$/.test(code) ? code : 'UNKNOWN' }));
  return new DatabaseError('DB_ERROR', 500, 'No se pudo completar la operación con la base de datos.', error);
}

/** Ejecuta una operación SQL y normaliza cualquier error que arroje. */
export async function runDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) {
    if (error instanceof AppError) throw error;
    throw normalizeDatabaseError(error);
  }
}
