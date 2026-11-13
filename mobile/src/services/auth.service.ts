/**
 * ARCHIVO: auth.service.ts
 * UBICACIÓN: mobile/src/services/auth.service.ts
 * FUNCIÓN: Implementa las solicitudes de registro, login, recuperación y mantenimiento de sesión.
 * RESPONSABILIDAD: Validar respuestas de autenticación y adaptar los datos de entrada antes de enviarlos.
 * CONEXIONES: Importa: mobile/src/services/api.ts, mobile/src/utils/auth-validation.ts, mobile/src/types/auth.ts, mobile/src/services/verification.service.ts Se utiliza desde: mobile/src/app/change-initial-password.tsx, mobile/src/app/reset-password.tsx, mobile/src/components/ui/RecoveryNotice.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/oauth.service.ts
 * FUNCIONAMIENTO: Usa apiRequest para hablar con /auth, normaliza email, valida usuario/sesión y delega los desafíos a verification.service.ts.
 * IMPORTANCIA: Es el límite entre AuthContext y los endpoints de autenticación; evita confiar en estructuras de sesión no verificadas.
 */
/** Acceso a auth/register, auth/login y auth/me; la confirmación nunca se envía al backend. */
import { apiRequest, ApiError } from './api';
import { normalizeEmail } from '../utils/auth-validation';
import type { AccessSession, AuthUser, LoginValues, RegisterValues, RegistrationResult } from '../types/auth';
import { readVerification } from './verification.service';

/** Valida identidad, rol y perfiles profesionales; normaliza colecciones y datos opcionales. */
function readUser(value: unknown): AuthUser {
  if (typeof value !== 'object' || !value) throw new ApiError('INVALID_RESPONSE', 'No pudimos validar la respuesta de PetCare.');
  const user = value as AuthUser;
  if (typeof user.id !== 'string' || !/^[1-9]\d*$/.test(user.id) || typeof user.firstName !== 'string' || typeof user.lastName !== 'string' || typeof user.email !== 'string' || (user.phone !== null && typeof user.phone !== 'string') || typeof user.role !== 'string' || !/^[A-Z][A-Z0-9_]{0,31}$/.test(user.role) || (user.permissions !== undefined && (!Array.isArray(user.permissions) || user.permissions.some(code=>typeof code!=='string'||!/^[a-z][a-z0-9_.]{0,99}$/.test(code))))) {
    throw new ApiError('INVALID_RESPONSE', 'No pudimos validar la respuesta de PetCare.');
  }
  if (user.veterinarian!==undefined && user.veterinarian!==null) {
    const profile=user.veterinarian;
    if (typeof profile!=='object'||typeof profile.id!=='string'||typeof profile.licenseNumber!=='string'||!Array.isArray(profile.specialties)||profile.specialties.some(s=>!s||typeof s.id!=='string'||typeof s.name!=='string')) {
      throw new ApiError('INVALID_RESPONSE','No pudimos validar el perfil veterinario de PetCare.');
    }
  }
  if(user.professional!==undefined&&user.professional!==null){const p=user.professional;if(typeof p.typeId!=='string'||typeof p.name!=='string'||typeof p.isClinical!=='boolean'||!Array.isArray(p.serviceIds)||p.serviceIds.some(s=>typeof s!=='string'))throw new ApiError('INVALID_RESPONSE','No pudimos validar el perfil profesional.');}
  return { professional:user.professional??null,id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, profilePhotoUrl:typeof user.profilePhotoUrl==='string'?user.profilePhotoUrl:null, role: user.role,permissions:user.permissions ?? [],veterinarian:user.veterinarian ?? null,
    ...(typeof user.roleName==='string'?{roleName:user.roleName}:{}) };
}

/** Envía los datos permitidos de registro; normaliza nombres/email y omite role y confirmación de contraseña. */
export async function register(values: RegisterValues): Promise<RegistrationResult> {
  const result = await apiRequest<{ user: unknown; verification: unknown }>('/auth/register', { method: 'POST', body: {
    firstName: values.firstName.trim().normalize('NFC').replace(/\s+/g, ' '),
    lastName: values.lastName.trim().normalize('NFC').replace(/\s+/g, ' '),
    email: normalizeEmail(values.email), phone: values.phone.trim(), password: values.password,
  } });
  return { user: readUser(result.user), verification: readVerification(result.verification) };
}
/** Envía email y contraseña a /auth/login y valida la estructura de sesión antes de devolverla al contexto. */
export async function login(values: LoginValues): Promise<AccessSession> {
  const result = await apiRequest<AccessSession>('/auth/login', { method: 'POST', body: { email: normalizeEmail(values.email), password: values.password } });
  return readAccessSession(result);
}
/** Inicia la recuperación mediante el endpoint público; no devuelve si la cuenta existe. */
export async function requestPasswordReset(email: string): Promise<void> {
  await apiRequest('/auth/password-reset/request',{method:'POST',body:{email:normalizeEmail(email)}});
}
/** Envía token y clave nueva al endpoint de confirmación y propaga errores de API para que la pantalla los presente. */
export async function resetPassword(token: string,password: string): Promise<void> {
  await apiRequest('/auth/password-reset/confirm',{method:'POST',body:{token,password}});
}
/** Cambia la contraseña temporal usando email, clave actual y nueva clave; no guarda la sesión por sí misma. */
export async function changeInitialPassword(email:string,currentPassword:string,newPassword:string):Promise<void>{
  await apiRequest('/auth/change-initial-password',{method:'POST',body:{email:normalizeEmail(email),currentPassword,newPassword}});
}
/** Valida access token, refresh token, tipo, vencimiento y usuario antes de entregar la sesión al contexto. */
export function readAccessSession(value: unknown): AccessSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new ApiError('INVALID_RESPONSE', 'No pudimos validar la sesión de PetCare.');
  }
  const result=value as AccessSession;
  if (typeof result.accessToken !== 'string' || !result.accessToken || result.accessToken.length > 4096 || result.tokenType !== 'Bearer' || !Number.isInteger(result.expiresIn) || result.expiresIn <= 0 || result.expiresIn > 3600) {
    throw new ApiError('INVALID_RESPONSE', 'No pudimos validar la sesión de PetCare.');
  }
  if (typeof result.refreshToken !== 'string' || !/^[a-f0-9]{64}$/.test(result.refreshToken)) throw new ApiError('INVALID_RESPONSE','No pudimos validar la renovación de sesión.');
  return { ...result, user: readUser(result.user) };
}
/** Solicita la rotación de sesión al backend y valida la respuesta antes de permitir que AuthContext la persista. */
export async function refresh(refreshToken: string): Promise<AccessSession> {
  return readAccessSession(await apiRequest<AccessSession>('/auth/refresh',{method:'POST',body:{refreshToken}}));
}
/** Revoca la familia de sesión en backend; el borrado local lo coordina AuthContext/session-store. */
export async function logout(refreshToken: string): Promise<void> {
  await apiRequest('/auth/logout',{method:'POST',body:{refreshToken}});
}
/** Consulta /auth/me con el access token y valida al usuario rehidratado desde el servidor. */
export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  const result = await apiRequest<{ user: unknown }>('/auth/me', { method: 'POST', body: {}, accessToken });
  return readUser(result.user);
}
