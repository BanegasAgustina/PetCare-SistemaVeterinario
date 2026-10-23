import type { AuthUser } from '../types/auth';

export function roleLabel(role: AuthUser['role'], name: string): string {
  const labels: Partial<Record<AuthUser['role'], string>> = {
    CLIENT: 'Cliente',
    VETERINARIAN: 'Veterinario',
    GROOMER: 'Peluquería',
    SECRETARY: 'Secretaría',
    ADMIN: 'Administrador',
    SUPER_ADMIN: 'Admin Principal',
  };
  return labels[role] ?? name;
}
