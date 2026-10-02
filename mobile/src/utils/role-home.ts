import type { AuthUser } from '../types/auth';
/** El rol es el contrato de navegación; la identidad nunca se decide por email o ID. */
export function roleHome(user: AuthUser | null): '/login' | '/client' | '/vet' | '/admin' {
  if (!user) return '/login';
  if (user.role==='VETERINARIAN') return '/vet';
  if (user.role==='SUPER_ADMIN' || user.role==='ADMIN') return '/admin';
  return '/client';
}
