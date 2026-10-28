// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

import { timingSafeEqual } from 'node:crypto';

// Función isCronAuthorized: comprueba una regla o condición dentro de este módulo.
export function isCronAuthorized(authorization: string | undefined, secret: string): boolean {
  if (Buffer.byteLength(secret, 'utf8') < 32) return false;
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : '';
  const expectedBytes = Buffer.from(secret, 'utf8');
  const providedBytes = Buffer.from(token, 'utf8');
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}
