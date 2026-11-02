/**
 * ARCHIVO: password-reset-token.ts
 * UBICACIÓN: backend/src/utils/password-reset-token.ts
 * FUNCIÓN: Valida y normaliza un token de restablecimiento de contraseña.
 * RESPONSABILIDAD: Asegurar que solo tokens hexadecimales con longitud prevista lleguen al servicio.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/password-reset.service.ts
 * FUNCIONAMIENTO: Recibe unknown, valida forma exacta y entrega cadena normalizada o AppError.
 * IMPORTANCIA: Reduce entradas inválidas antes de consultar almacenamiento de tokens.
 */
import { AppError } from './app-error';

/** Valida el alfabeto hexadecimal y normaliza el token para consulta. */
export function normalizePasswordResetToken(value: unknown): string {
  if (typeof value !== 'string') throw new AppError('PASSWORD_RESET_INVALID', 400, 'El enlace no es válido o venció.');
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new AppError('PASSWORD_RESET_INVALID', 400, 'El enlace no es válido o venció.');
  }
  return normalized;
}
