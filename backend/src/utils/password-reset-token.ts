// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

import { AppError } from './app-error';

// Función normalizePasswordResetToken: transforma o prepara datos dentro de este módulo.
export function normalizePasswordResetToken(value: unknown): string {
  if (typeof value !== 'string') throw new AppError('PASSWORD_RESET_INVALID', 400, 'El enlace no es válido o venció.');
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new AppError('PASSWORD_RESET_INVALID', 400, 'El enlace no es válido o venció.');
  }
  return normalized;
}
