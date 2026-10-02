/** Lista blanca estricta: rol, password_hash y privilegios críticos nunca llegan al modelo. */
import { AppError } from '../utils/app-error';
import { normalizeEmail, readName, readPhone, readPassword } from './auth.validator';
export type VetInput = {
  firstName: string; lastName: string; email: string; phone: string | null; licenseNumber: string;
  isActive: boolean; specialtyIds: string[]; overrides: { code: string; allowed: boolean | null }[];
};
export function objectBody(value: unknown, fields: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !fields.includes(key))) {
    throw new AppError('VALIDATION_ERROR',400,'La solicitud contiene campos no permitidos.');
  }
  return value as Record<string,unknown>;
}
export function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,19}$/.test(value) || BigInt(value) > 18446744073709551615n) {
    throw new AppError('VALIDATION_ERROR',400,'Identificador inválido.');
  }
  return value;
}
export function textField(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    throw new AppError('VALIDATION_ERROR',400,`${label} es obligatorio y admite hasta ${max} caracteres.`);
  }
  return value.trim().normalize('NFC');
}
export function permissionOverrides(value: unknown): VetInput['overrides'] {
  if (!Array.isArray(value) || value.length > 100) throw new AppError('VALIDATION_ERROR',400,'Revisá los permisos.');
  const seen = new Set<string>();
  return value.map(item => {
    const body = objectBody(item,['code','allowed']);
    const code = textField(body.code,'El permiso',80);
    if (seen.has(code) || !(typeof body.allowed === 'boolean' || body.allowed === null)) throw new AppError('VALIDATION_ERROR',400,'Permiso repetido o valor inválido.');
    seen.add(code); return { code, allowed: body.allowed as boolean | null };
  });
}
export function validateVet(value: unknown): VetInput {
  const body = objectBody(value,['firstName','lastName','email','phone','licenseNumber','isActive','specialtyIds','overrides']);
  // Reutiliza las mismas reglas de identidad sin crear ni conservar una contraseña de administrador.
  if (typeof body.isActive !== 'boolean') throw new AppError('VALIDATION_ERROR',400,'Indicá el estado de la cuenta.');
  if (!Array.isArray(body.specialtyIds) || !body.specialtyIds.length || body.specialtyIds.length > 50) throw new AppError('VALIDATION_ERROR',400,'Seleccioná al menos una especialidad.');
  const specialtyIds = body.specialtyIds.map(identifier);
  if (new Set(specialtyIds).size !== specialtyIds.length) throw new AppError('VALIDATION_ERROR',400,'Especialidad repetida.');
  return { firstName: readName(body.firstName,'El nombre'),lastName: readName(body.lastName,'El apellido'),email: normalizeEmail(body.email),phone: readPhone(body.phone),
    licenseNumber: textField(body.licenseNumber,'La matrícula',80),isActive: body.isActive,specialtyIds,overrides: permissionOverrides(body.overrides) };
}
export function validateInvitation(value: unknown) {
  const body = objectBody(value,['token','password']);
  if (typeof body.token !== 'string' || !/^[a-f0-9]{64}$/.test(body.token)) throw new AppError('INVALID_INVITATION',400,'La invitación no es válida o venció.');
  return { token: body.token,password: readPassword(body.password,true) };
}
