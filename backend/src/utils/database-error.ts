/** Convierte errores MySQL en errores públicos seguros; nunca publica sqlMessage/sql. */
import { AppError } from './app-error';
export class DatabaseError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'DatabaseError';
  }
}

const unavailableCodes = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR', 'PROTOCOL_ENQUEUE_AFTER_QUIT',
  'ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR',
  'ER_CON_COUNT_ERROR', 'ER_SERVER_SHUTDOWN', 'ER_SERVER_OFFLINE_MODE',
]);

export function normalizeDatabaseError(error: unknown): DatabaseError {
  if (error instanceof DatabaseError) return error;
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  if (unavailableCodes.has(code)) return new DatabaseError('DB_UNAVAILABLE', 503, 'La base de datos no está disponible. Intentá nuevamente.', error);
  if (['ER_NO_SUCH_TABLE','ER_BAD_FIELD_ERROR'].includes(code)) return new DatabaseError('SCHEMA_UPDATE_REQUIRED',503,'La clínica requiere aplicar la nueva migración antes de usar este módulo.',error);
  if (code === 'ER_DUP_ENTRY') return new DatabaseError('DB_CONFLICT', 409, 'Ya existe un registro con esos datos únicos.', error);
  if (['ER_NO_REFERENCED_ROW_2', 'ER_ROW_IS_REFERENCED_2'].includes(code)) {
    return new DatabaseError('DB_RELATION_CONFLICT', 409, 'La operación no respeta las relaciones entre los registros.', error);
  }
  if (['ER_CHECK_CONSTRAINT_VIOLATED', 'ER_BAD_NULL_ERROR', 'ER_DATA_TOO_LONG', 'ER_TRUNCATED_WRONG_VALUE', 'WARN_DATA_TRUNCATED'].includes(code)) {
    return new DatabaseError('DB_INVALID_DATA', 400, 'Los datos no cumplen los requisitos de la base de datos.', error);
  }
  return new DatabaseError('DB_ERROR', 500, 'No se pudo completar la operación con la base de datos.', error);
}

/** Frontera común que usarán servicios y futuros repositorios para proteger errores SQL. */
export async function runDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) {
    if (error instanceof AppError) throw error;
    throw normalizeDatabaseError(error);
  }
}
