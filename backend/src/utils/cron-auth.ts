/**
 * ARCHIVO: cron-auth.ts
 * UBICACIÓN: backend/src/utils/cron-auth.ts
 * FUNCIÓN: Valida la credencial HTTP de trabajos programados.
 * RESPONSABILIDAD: Comprobar autorización Bearer antes de ejecutar jobs internos.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/routes/notification-jobs.routes.ts
 * FUNCIONAMIENTO: Compara el valor recibido con secreto configurado usando las reglas de cabecera implementadas.
 * IMPORTANCIA: Evita exponer rutas programadas sin autenticación de servicio.
 */
import { timingSafeEqual } from 'node:crypto';

/** Acepta la credencial del job solo si coincide con el secreto configurado. */
export function isCronAuthorized(authorization: string | undefined, secret: string): boolean {
  if (Buffer.byteLength(secret, 'utf8') < 32) return false;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const expectedBytes = Buffer.from(secret, 'utf8');
  const providedBytes = Buffer.from(token, 'utf8');
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}
