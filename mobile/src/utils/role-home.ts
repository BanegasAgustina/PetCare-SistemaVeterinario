/**
 * Selecciona el panel usando el rol de /auth/me: cliente, veterinario, peluquero, secretaría o administración. No deduce privilegios por email ni ID.
 */
import type { AuthUser } from '../types/auth';
/** El rol es el contrato de navegación; la identidad nunca se decide por email o ID. */
export function roleHome(user: AuthUser | null): '/login' | '/client' | '/vet' | '/admin' | '/professional' | '/secretary' {
  if (!user) return '/login';
  if (user.role==='VETERINARIAN') return '/vet';
  if (user.role==='GROOMER') return '/professional';
  if (user.role==='SECRETARY') return '/secretary';
  if (user.role==='SUPER_ADMIN' || user.role==='ADMIN') return '/admin';
  return '/client';
}
