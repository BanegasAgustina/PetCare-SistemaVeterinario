/**
 * ARCHIVO: back-navigation.ts
 * UBICACIÓN: mobile/src/utils/back-navigation.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de back-navigation.
 * CONEXIONES: Importa: mobile/src/types/auth.ts, mobile/src/utils/role-home.ts Se utiliza desde: mobile/src/hooks/useBackNavigation.ts
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import type { AuthUser } from '../types/auth';
import { roleHome } from './role-home';

const primaryRoutesByRole: Record<string, Set<string>> = {
  CLIENT: new Set(['/client', '/client/pets', '/client/appointments', '/client/store', '/client/profile']),
  VETERINARIAN: new Set(['/vet', '/vet/agenda', '/vet/patients', '/vet/clients', '/vet/products']),
  GROOMER: new Set(['/professional', '/professional/agenda', '/professional/patients', '/professional/services']),
  ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
  SUPER_ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
};

/** Oculta el botón en rutas principales del rol y workspace; las rutas secundarias permiten volver. */
export function shouldShowRouteBack(pathname: string, role?: string) {
  if (pathname === '/workspace') return false;
  return !(primaryRoutesByRole[role ?? '']?.has(pathname) ?? false);
}

export type BackControlPlacement = 'none' | 'shell' | 'screen';

/** Asigna el botón de volver a la navegación global o a la pantalla según ruta, sin duplicar controles. */
export function backControlPlacement(pathname: string, role?: string): BackControlPlacement {
  if (!shouldShowRouteBack(pathname, role)) return 'none';
  const admin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const screenOwnsAdminBack = pathname === '/admin/agenda' || pathname === '/admin/appointment';
  return admin && !screenOwnsAdminBack ? 'shell' : 'screen';
}

export type BackNavigationAction = { type:'back' } | { type:'replace'; path:ReturnType<typeof roleHome> } | { type:'stay' };

/** Conserva el historial si existe; en enlace directo reemplaza por inicio del rol o permanece si ya está allí. */
export function backNavigationAction(canGoBack: boolean, pathname: string, user: AuthUser | null): BackNavigationAction {
  if (canGoBack) return { type:'back' };
  const fallback=roleHome(user);
  return pathname===fallback?{type:'stay'}:{type:'replace',path:fallback};
}
