/**
 * ARCHIVO: role-label.ts
 * UBICACIÓN: mobile/src/utils/role-label.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de role-label.
 * CONEXIONES: Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/profile/AccountProfileScreen.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import type { AuthUser } from '../types/auth';

/** Presenta el nombre local del rol y conserva el nombre recibido para códigos no incluidos en el mapa. */
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
