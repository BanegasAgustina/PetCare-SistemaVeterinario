import { AppError } from './app-error';

export function normalizePasswordResetToken(value: unknown): string {
  if (typeof value !== 'string') throw new AppError('PASSWORD_RESET_INVALID', 400, 'El enlace no es válido o venció.');
  const normalized = value.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new AppError('PASSWORD_RESET_INVALID', 400, 'El enlace no es válido o venció.');
  }
  return normalized;
}
