/** Acceso a auth/register, auth/login y auth/me; la confirmación nunca se envía al backend. */
import { apiRequest, ApiError } from './api';
import { normalizeEmail } from '../utils/auth-validation';
import type { AccessSession, AuthUser, LoginValues, RegisterValues, RegistrationResult } from '../types/auth';
import { readVerification } from './verification.service';

function readUser(value: unknown): AuthUser {
  if (typeof value !== 'object' || !value) throw new ApiError('INVALID_RESPONSE', 'No pudimos validar la respuesta de PetCare.');
  const user = value as AuthUser;
  if (typeof user.id !== 'string' || !/^[1-9]\d*$/.test(user.id) || typeof user.firstName !== 'string' || typeof user.lastName !== 'string' || typeof user.email !== 'string' || (user.phone !== null && typeof user.phone !== 'string') || !['CLIENT', 'VETERINARIAN', 'ADMIN'].includes(user.role)) {
    throw new ApiError('INVALID_RESPONSE', 'No pudimos validar la respuesta de PetCare.');
  }
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role };
}

export async function register(values: RegisterValues): Promise<RegistrationResult> {
  const result = await apiRequest<{ user: unknown; verification: unknown }>('/auth/register', { method: 'POST', body: {
    firstName: values.firstName.trim().normalize('NFC').replace(/\s+/g, ' '),
    lastName: values.lastName.trim().normalize('NFC').replace(/\s+/g, ' '),
    email: normalizeEmail(values.email), phone: values.phone.trim(), password: values.password,
  } });
  return { user: readUser(result.user), verification: readVerification(result.verification) };
}
export async function login(values: LoginValues): Promise<AccessSession> {
  const result = await apiRequest<AccessSession>('/auth/login', { method: 'POST', body: { email: normalizeEmail(values.email), password: values.password } });
  if (typeof result.accessToken !== 'string' || !result.accessToken || result.accessToken.length > 4096 || result.tokenType !== 'Bearer' || !Number.isInteger(result.expiresIn) || result.expiresIn <= 0 || result.expiresIn > 3600) {
    throw new ApiError('INVALID_RESPONSE', 'No pudimos validar la sesión de PetCare.');
  }
  return { ...result, user: readUser(result.user) };
}
export async function getCurrentUser(accessToken: string): Promise<AuthUser> {
  const result = await apiRequest<{ user: unknown }>('/auth/me', { accessToken });
  return readUser(result.user);
}
