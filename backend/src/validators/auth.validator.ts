/** Validación independiente del frontend: normaliza identidad sin alterar la contraseña. */
import isEmail from 'validator/lib/isEmail';
import { AppError } from '../utils/app-error';
import type { LoginInput, RegisterInput } from '../types/auth';

const namePattern = /^[\p{L}][\p{L}\p{M}]*(?:[ '\u2019-][\p{L}][\p{L}\p{M}]*)*$/u;
function invalid(message: string): never { throw new AppError('VALIDATION_ERROR', 400, message); }

function readObject(value: unknown, allowedFields: string[]): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) invalid('La solicitud debe contener un objeto JSON.');
  if (Object.keys(value).some((key) => !allowedFields.includes(key))) invalid('La solicitud contiene campos no permitidos.');
  return value as Record<string, unknown>;
}

export function readName(value: unknown, label: string): string {
  if (typeof value !== 'string') invalid(`${label} es obligatorio.`);
  const normalized = value.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!normalized) invalid(`${label} es obligatorio.`);
  if ([...normalized].length > 100 || !namePattern.test(normalized)) invalid(`${label} debe contener letras, espacios, apóstrofes o guiones, sin números.`);
  return normalized;
}

export function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) invalid('El email es obligatorio.');
  const normalized = value.trim().normalize('NFC').toLowerCase();
  // No se eliminan puntos ni sufijos +: podrían identificar cuentas distintas.
  if (normalized.length > 254 || !isEmail(normalized, { allow_utf8_local_part: false, require_tld: true })) invalid('Ingresá un email válido.');
  return normalized;
}

export function readPhone(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') invalid('El teléfono debe ser texto para conservar sus prefijos.');
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/[ ()-]/g, '');
  if (trimmed.length > 40 || !/^\+?[0-9 ()-]+$/.test(trimmed) || !/^\+?\d{7,15}$/.test(normalized)) invalid('Ingresá un teléfono de 7 a 15 dígitos; podés incluir el prefijo +.');
  return normalized;
}

export function readPassword(value: unknown, requireStrength: boolean): string {
  if (typeof value !== 'string' || value.length === 0) invalid('La contraseña es obligatoria.');
  // bcrypt solo procesa 72 bytes. Rechazar el exceso evita contraseñas distintas con el mismo prefijo efectivo.
  if (Buffer.byteLength(value, 'utf8') > 72) invalid('La contraseña no debe superar 72 bytes en UTF-8.');
  if (requireStrength && ([...value].length < 8 || !/\p{Lu}/u.test(value) || !/\p{Ll}/u.test(value) || !/\d/.test(value) || !/[^\p{L}\p{N}\s]/u.test(value))) {
    invalid('La contraseña debe tener al menos 8 caracteres, mayúscula, minúscula, número y carácter especial.');
  }
  return value;
}

export function validateRegister(value: unknown): RegisterInput {
  const body = readObject(value, ['firstName', 'lastName', 'email', 'phone', 'password']);
  return { firstName: readName(body.firstName, 'El nombre'), lastName: readName(body.lastName, 'El apellido'), email: normalizeEmail(body.email), phone: readPhone(body.phone), password: readPassword(body.password, true) };
}

export function validateLogin(value: unknown): LoginInput {
  const body = readObject(value, ['email', 'password']);
  return { email: normalizeEmail(body.email), password: readPassword(body.password, false) };
}
