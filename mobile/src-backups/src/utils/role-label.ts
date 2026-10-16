import type { AuthUser } from '../types/auth';

export function roleLabel(role: AuthUser['role'], name: string): string {
  return role === 'SUPER_ADMIN' ? 'Administrador principal' : name;
}
