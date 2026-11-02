/**
 * ARCHIVO: auth-validation.ts
 * UBICACIÓN: mobile/src/utils/auth-validation.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de auth-validation.
 * CONEXIONES: Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/client/PetEditor.tsx, mobile/src/components/forms/ActivationForm.tsx y 4 más
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Validación educativa de formularios; el servidor repite todas las reglas importantes. */
import isEmail from 'validator/lib/isEmail';
import isMobilePhone from 'validator/lib/isMobilePhone';
import type { LoginValues, RegisterValues, RegistrationFormValues } from '../types/auth';

// Tipo FieldErrors: define la forma o las opciones válidas de los datos usados por este módulo.
export type FieldErrors<T> = Partial<Record<keyof T, string>>;
/** Devuelve el primer campo con error según el orden visual indicado para enfocar el primer control inválido. */
export function firstInvalidField<T extends PropertyKey>(order: readonly T[], errors: Partial<Record<T, string>>): T | undefined {
  return order.find(field => Boolean(errors[field]));
}
/** Recorta, normaliza Unicode NFC y pasa el email a minúsculas para alinear formulario y servicio. */
export const normalizeEmail = (email: string) => email.trim().normalize('NFC').toLowerCase();
/** Acepta solo teléfonos internacionales completos y devuelve su forma E.164 normalizada. */
export function normalizePhoneNumber(value: string): { phone?: string; error?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { error: 'Ingresá tu número de teléfono.' };
  if (trimmed.length > 40 || !/^\+[0-9 ]+$/.test(trimmed)) return { error: 'Usá el prefijo internacional + y solo números separados por espacios.' };
  const normalized = trimmed.replace(/ /g, '');
  const digits = normalized.slice(1);
  if (digits.length < 8 || digits.length > 15 || /^0+$/.test(digits) || !isMobilePhone(normalized, 'any', { strictMode: true })) return { error: 'Ingresá un número internacional válido y completo.' };
  if (normalized.startsWith('+54') && !/^\+549\d{10}$/.test(normalized)) return { error: 'Para Argentina, ingresá un celular con +54 9, sin el 0 ni el 15.' };
  return { phone: normalized };
}
// Dato namePattern: conserva un valor calculado o de configuración usado por este módulo.
const namePattern = /^[\p{L}][\p{L}\p{M}]*(?:[ '\u2019-][\p{L}][\p{L}\p{M}]*)*$/u;

/** Cuenta bytes UTF-8 sin depender de Buffer (que no existe en React Native). */
/** Cuenta bytes UTF-8 sin Buffer para aplicar en React Native el límite bcrypt de 72 bytes. */
function utf8Bytes(value: string): number {
  return [...value].reduce((total, character) => {
    const point = character.codePointAt(0)!;
    return total + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
  }, 0);
}
/** Devuelve un mensaje si falta el email o falla isEmail; undefined indica que la entrada pasó esta validación local. */
function emailError(value: string): string | undefined {
  const email = normalizeEmail(value);
  if (!email) return 'Ingresá tu email.';
  if (email.length > 254 || !isEmail(email, { allow_utf8_local_part: false, require_tld: true })) return 'Ingresá un email válido.';
}
/** Valida email y contraseña antes del login y devuelve mensajes por campo; la API vuelve a validar las credenciales. */
export function validateLoginForm(values: LoginValues): FieldErrors<LoginValues> {
  const errors: FieldErrors<LoginValues> = {};
  const message = emailError(values.email);
  if (message) errors.email = message;
  if (!values.password) errors.password = 'Ingresá tu contraseña.';
  else if (utf8Bytes(values.password) > 72) errors.password = 'La contraseña es demasiado larga.';
  return errors;
}
/** Valida nombre, apellido, email y teléfono en el paso de identidad del registro. */
export function validateIdentityForm(values: Pick<RegisterValues,'firstName'|'lastName'|'email'|'phone'>): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  for (const field of ['firstName', 'lastName'] as const) {
    const name = values[field].normalize('NFC').trim().replace(/\s+/g, ' ');
    if (!name) errors[field] = field === 'firstName' ? 'Ingresá tu nombre.' : 'Ingresá tu apellido.';
    else if ([...name].length > 100 || !namePattern.test(name)) errors[field] = 'Usá letras, espacios, apóstrofes o guiones; sin números.';
  }
  const emailMessage = emailError(values.email);
  if (emailMessage) errors.email = emailMessage;
  if (values.phone.trim()) {
    const phone = normalizePhoneNumber(values.phone);
    if (phone.error) errors.phone = phone.error;
  }
  return errors;
}
/** Comprueba política de contraseña, límite UTF-8 y coincidencia de confirmación para el registro. */
export function validatePasswordForm(values: Pick<RegisterValues,'password'|'confirmPassword'>): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {};
  if ([...values.password].length < 8 || !/\p{Lu}/u.test(values.password) || !/\p{Ll}/u.test(values.password) || !/\d/.test(values.password) || !/[^\p{L}\p{N}\s]/u.test(values.password)) errors.password = 'Incluí 8 caracteres, mayúscula, minúscula, número y símbolo.';
  else if (utf8Bytes(values.password) > 72) errors.password = 'La contraseña es demasiado larga. Usá menos caracteres.';
  if (!values.confirmPassword) errors.confirmPassword = 'Repetí tu contraseña.';
  else if (values.confirmPassword !== values.password) errors.confirmPassword = 'Las contraseñas no coinciden.';
  return errors;
}
/** Combina los errores de identidad y contraseña para un formulario de registro con campos separados. */
export function validateRegisterForm(values: RegisterValues): FieldErrors<RegisterValues> {
  return {...validateIdentityForm(values),...validatePasswordForm(values)};
}
/** Conserva el contrato existente: primer término como nombre y resto como apellido compuesto. */
/** Convierte fullName del formulario a firstName/lastName del contrato de registro; el resto de valores se conserva. */
export function registrationPayload(values: RegistrationFormValues): RegisterValues {
  const [firstName = '', ...surname] = values.fullName.normalize('NFC').trim().split(/\s+/);
  const { fullName: _fullName, ...rest } = values;
  return { ...rest, firstName, lastName: surname.join(' ') };
}
/** Valida el formulario alternativo de nombre completo y devuelve el error de identidad bajo la clave fullName. */
export function validateRegistrationForm(values: RegistrationFormValues): FieldErrors<RegistrationFormValues> {
  const { firstName, lastName, ...errors } = validateRegisterForm(registrationPayload(values));
  return { ...errors, ...(firstName || lastName ? { fullName: 'Ingresá nombre y apellido, usando letras y sin números.' } : {}) };
}
