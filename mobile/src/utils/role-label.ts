// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

import type { AuthUser } from '../types/auth';

// Función roleLabel: concentra la lógica dentro de este módulo.
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
