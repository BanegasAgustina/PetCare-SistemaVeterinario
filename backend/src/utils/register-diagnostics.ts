/** Diagnóstico temporal opt-in. Nunca registra cuerpo, email, hashes, códigos ni credenciales. */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { AppError } from './app-error';
import { DatabaseError } from './database-error';

export type RegisterStage = 'request_received' | 'validation' | 'validation_ok' | 'mail_configuration' | 'mail_configuration_ok'
  | 'checking_existing_email' | 'existing_email_checked' | 'password_hashing' | 'password_hashed'
  | 'database_connection' | 'database_connection_ok' | 'client_role_resolution' | 'client_role_resolved'
  | 'creating_user' | 'user_created' | 'user_committed' | 'verification_proof' | 'verification_persisted'
  | 'verification_code_reservation' | 'verification_code_persisted' | 'sending_verification_email'
  | 'verification_email_sent' | 'verification_email_failed' | 'verification_delivery_persisted' | 'completed';
const context = new AsyncLocalStorage<{ requestId: string; stage: RegisterStage }>();
const driverMessages: Record<string,string> = {
  ER_ACCESS_DENIED_ERROR: 'MySQL rechazó la autenticación de la cuenta configurada.',
  ER_DBACCESS_DENIED_ERROR: 'MySQL denegó acceso a la base configurada.',
  ER_BAD_DB_ERROR: 'La base configurada no existe.',
  ER_NO_SUCH_TABLE: 'Falta una tabla requerida por la operación.',
  ER_BAD_FIELD_ERROR: 'Falta una columna requerida por la operación.',
  ECONNREFUSED: 'El servicio rechazó la conexión.', ETIMEDOUT: 'La conexión agotó el tiempo de espera.',
  ENOTFOUND: 'No se pudo resolver el servidor configurado.',
  EAUTH: 'El proveedor SMTP rechazó la autenticación.', ECONNECTION: 'No se pudo conectar al proveedor SMTP.',
};
/** Lista blanca en lugar de error.message/stack/response/sqlMessage, que pueden contener secretos. */
export function safeRegisterError(error: unknown) {
  const object = error && typeof error === 'object' ? error as { code?: unknown; cause?: unknown } : {};
  const rawCode = typeof object.code === 'string' ? object.code : '';
  const code = Object.hasOwn(driverMessages,rawCode) ? rawCode : null;
  const controlled = error instanceof AppError || error instanceof DatabaseError;
  const cause = object.cause && typeof object.cause === 'object' ? object.cause as { code?:unknown } : {};
  const causeCode = typeof cause.code === 'string' && Object.hasOwn(driverMessages,cause.code) ? cause.code : null;
  return {
    name: error instanceof AppError ? 'AppError' : error instanceof DatabaseError ? 'DatabaseError' : 'Error',
    code: controlled ? error.code : code ?? 'UNCLASSIFIED',
    driverCode: causeCode ?? code,
    message: driverMessages[causeCode ?? code ?? ''] ?? (controlled ? 'Error controlado del registro; consultar su código público.' : 'Error interno; detalle sensible omitido.'),
  };
}
export function registerStage(stage: RegisterStage): void {
  const trace = context.getStore();
  if (!trace) return;
  trace.stage = stage;
  console.info('[REGISTER]',JSON.stringify({ requestId: trace.requestId,stage }));
}
export function registerDiagnosticFailure(error: unknown): void {
  const trace = context.getStore();
  if (trace) console.error('[REGISTER][ERROR]',JSON.stringify({ requestId:trace.requestId,stage:trace.stage,...safeRegisterError(error) }));
}
export async function withRegisterDiagnostics<T>(operation: () => Promise<T>): Promise<T> {
  if (process.env.REGISTER_DIAGNOSTICS !== 'true' || process.env.NODE_ENV === 'production') return operation();
  return context.run({ requestId:randomUUID(),stage:'request_received' },async()=> {
    registerStage('request_received');
    try { const result=await operation();registerStage('completed');return result; }
    catch(error) {registerDiagnosticFailure(error);throw error;}
  });
}
