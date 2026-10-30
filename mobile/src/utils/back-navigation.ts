import type { AuthUser } from '../types/auth';
import { roleHome } from './role-home';

const primaryRoutesByRole: Record<string, Set<string>> = {
  CLIENT: new Set(['/client', '/client/pets', '/client/appointments', '/client/store', '/client/profile']),
  VETERINARIAN: new Set(['/vet', '/vet/agenda', '/vet/patients', '/vet/clients', '/vet/products']),
  GROOMER: new Set(['/professional', '/professional/agenda', '/professional/patients', '/professional/services']),
  ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
  SUPER_ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
};

export function shouldShowRouteBack(pathname: string, role?: string) {
  if (pathname === '/workspace') return false;
  return !(primaryRoutesByRole[role ?? '']?.has(pathname) ?? false);
}

export type BackControlPlacement = 'none' | 'shell' | 'screen';

/** Gives each secondary route exactly one owner for its responsive back control. */
export function backControlPlacement(pathname: string, role?: string): BackControlPlacement {
  if (!shouldShowRouteBack(pathname, role)) return 'none';
  const admin = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const screenOwnsAdminBack = pathname === '/admin/agenda' || pathname === '/admin/appointment';
  return admin && !screenOwnsAdminBack ? 'shell' : 'screen';
}

export type BackNavigationAction = { type:'back' } | { type:'replace'; path:ReturnType<typeof roleHome> } | { type:'stay' };

/** A direct link falls back to the authenticated role home; an existing route stack is preserved. */
export function backNavigationAction(canGoBack: boolean, pathname: string, user: AuthUser | null): BackNavigationAction {
  if (canGoBack) return { type:'back' };
  const fallback=roleHome(user);
  return pathname===fallback?{type:'stay'}:{type:'replace',path:fallback};
}
