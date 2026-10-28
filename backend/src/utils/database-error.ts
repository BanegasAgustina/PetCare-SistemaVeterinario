// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Convierte errores MySQL en errores públicos seguros; nunca publica sqlMessage/sql. */
import { AppError } from './app-error';
// Clase DatabaseError: agrupa estado y operaciones que trabajan como una unidad.
export class DatabaseError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'DatabaseError';
  }
}

// Dato unavailableCodes: conserva un valor calculado o de configuración usado por este módulo.
const unavailableCodes = new Set([
  'ECONNREFUSED', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EHOSTUNREACH', 'EACCES',
  'PROTOCOL_CONNECTION_LOST', 'PROTOCOL_ENQUEUE_AFTER_FATAL_ERROR', 'PROTOCOL_ENQUEUE_AFTER_QUIT',
  'ER_ACCESS_DENIED_ERROR', 'ER_DBACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR',
  'ER_CON_COUNT_ERROR', 'ER_SERVER_SHUTDOWN', 'ER_SERVER_OFFLINE_MODE', 'POOL_ENQUEUELIMIT',
]);

// Función normalizeDatabaseError: transforma o prepara datos dentro de este módulo.
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

/** Frontera común que usarán servicios y futuros repositorios para proteger errores SQL. */
// Función runDatabaseOperation: concentra la lógica dentro de este módulo.
export async function runDatabaseOperation<T>(operation: () => Promise<T>): Promise<T> {
  try { return await operation(); } catch (error) {
    if (error instanceof AppError) throw error;
    throw normalizeDatabaseError(error);
  }
}
