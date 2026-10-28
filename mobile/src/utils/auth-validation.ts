// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Validación educativa de formularios; el servidor repite todas las reglas importantes. */
import isEmail from 'validator/lib/isEmail';
import type { LoginValues, RegisterValues, RegistrationFormValues } from '../types/auth';

// Tipo FieldErrors: define la forma o las opciones válidas de los datos usados por este módulo.
export type FieldErrors<T> = Partial<Record<keyof T, string>>;
// Función firstInvalidField: concentra la lógica dentro de este módulo.
export function firstInvalidField<T extends PropertyKey>(order: readonly T[], errors: Partial<Record<T, string>>): T | undefined {
  return order.find(field => Boolean(errors[field]));
}
// Función normalizeEmail: concentra una operación reutilizable de este módulo.
export const normalizeEmail = (email: string) => email.trim().normalize('NFC').toLowerCase();
// Dato namePattern: conserva un valor calculado o de configuración usado por este módulo.
const namePattern = /^[\p{L}][\p{L}\p{M}]*(?:[ '\u2019-][\p{L}][\p{L}\p{M}]*)*$/u;

/** Cuenta bytes UTF-8 sin depender de Buffer (que no existe en React Native). */
// Función utf8Bytes: concentra la lógica dentro de este módulo.
function utf8Bytes(value: string): number {
  return [...value].reduce((total, character) => {
    const point = character.codePointAt(0)!;
    return total + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
  }, 0);
}
// Función emailError: concentra la lógica dentro de este módulo.
function emailError(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return 'Ingresá tu email.';
  if (email.length > 254 || !isEmail(email, { allow_utf8_local_part: false, require_tld: true })) return 'Ingresá un email válido.';
}
// Función validateLoginForm: comprueba una regla o condición dentro de este módulo.
export function validateLoginForm(values: LoginValues): FieldErrors<LoginValues> {
  const errors: FieldErrors<LoginValues> = {};
  const message = emailError(values.email);
  if (message) errors.email = message;
  if (!values.password) errors.password = 'Ingresá tu contraseña.';
  else if (utf8Bytes(values.password) > 72) errors.password = 'La contraseña es demasiado larga.';
  return errors;
}
// Función validateIdentityForm: comprueba una regla o condición dentro de este módulo.
export function validateIdentityForm(values: Pick<RegisterValues,'firstName'|'lastName'|'email'|'phone'>): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  for (const field of ['firstName', 'lastName'] as const) {
    const name = values[field].normalize('NFC').trim().replace(/\s+/g, ' ');
    if (!name) errors[field] = field === 'firstName' ? 'Ingresá tu nombre.' : 'Ingresá tu apellido.';
    else if ([...name].length > 100 || !namePattern.test(name)) errors[field] = 'Usá letras, espacios, apóstrofes o guiones; sin números.';
  }
  const emailMessage = emailError(values.email);
  if (emailMessage) errors.email = emailMessage;
  const phone = values.phone.trim();
  if (phone && (phone.length > 40 || !/^\+?[0-9 ()-]+$/.test(phone) || !/^\+?\d{7,15}$/.test(phone.replace(/[ ()-]/g, '')))) errors.phone = 'Ingresá de 7 a 15 dígitos; podés incluir +.';
  return errors;
}
// Función validatePasswordForm: comprueba una regla o condición dentro de este módulo.
export function validatePasswordForm(values: Pick<RegisterValues,'password'|'confirmPassword'>): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  if ([...values.password].length < 8 || !/\p{Lu}/u.test(values.password) || !/\p{Ll}/u.test(values.password) || !/\d/.test(values.password) || !/[^\p{L}\p{N}\s]/u.test(values.password)) errors.password = 'Incluí 8 caracteres, mayúscula, minúscula, número y símbolo.';
  else if (utf8Bytes(values.password) > 72) errors.password = 'La contraseña es demasiado larga. Usá menos caracteres.';
  if (!values.confirmPassword) errors.confirmPassword = 'Repetí tu contraseña.';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Las contraseñas no coinciden.';
  return errors;
}
// Función validateRegisterForm: comprueba una regla o condición dentro de este módulo.
export function validateRegisterForm(values: RegisterValues): FieldErrors<RegisterValues> {
  return {...validateIdentityForm(values),...validatePasswordForm(values)};
}
/** Conserva el contrato existente: primer término como nombre y resto como apellido compuesto. */
// Función registrationPayload: concentra la lógica dentro de este módulo.
export function registrationPayload(values: RegistrationFormValues): RegisterValues {
  const [firstName = '', ...surname] = values.fullName.normalize('NFC').trim().split(/\s+/);
  const { fullName: _fullName, ...rest } = values;
  return { ...rest, firstName, lastName: surname.join(' ') };
}
// Función validateRegistrationForm: comprueba una regla o condición dentro de este módulo.
export function validateRegistrationForm(values: RegistrationFormValues): FieldErrors<RegistrationFormValues> {
  const { firstName, lastName, ...errors } = validateRegisterForm(registrationPayload(values));
  return { ...errors, ...(firstName || lastName ? { fullName: 'Ingresá nombre y apellido, usando letras y sin números.' } : {}) };
}
