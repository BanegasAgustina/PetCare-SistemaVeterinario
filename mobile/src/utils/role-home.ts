/**
 * Selecciona el panel usando el rol de /auth/me. No deduce privilegios por email ni ID.
 */
import type { AuthUser } from '../types/auth';
import { hasPersonalCapabilityModule } from './capability-modules';
/** El rol es el contrato de navegación; la identidad nunca se decide por email o ID. */
export function roleHome(user: AuthUser | null): '/login' | '/client' | '/vet' | '/admin' | '/professional' | '/workspace' {
  if (!user) return '/login';
  if (user.role==='CLIENT') return '/client';
  if (user.role==='VETERINARIAN') return '/vet';
  if (user.role==='GROOMER') return '/professional';
  if (user.role==='SUPER_ADMIN' || user.role==='ADMIN') return '/admin';
  return '/workspace';
}

/** Mantener el destino de entrada y los guards del árbol raíz bajo la misma regla. */
export function canEnterClientRoot(user:AuthUser|null):boolean {
  return user?.role==='CLIENT'||hasPersonalCapabilityModule(user?.permissions);
}
export function canEnterWorkspace(user:AuthUser|null):boolean {
  return Boolean(user&&!['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(user.role));
}
