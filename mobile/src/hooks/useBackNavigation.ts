import { useCallback } from 'react';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { roleHome } from '../utils/role-home';

const primaryRoutesByRole: Record<string, Set<string>> = {
  CLIENT: new Set(['/client', '/client/pets', '/client/appointments', '/client/store', '/client/profile']),
  VETERINARIAN: new Set(['/vet', '/vet/agenda', '/vet/patients', '/vet/clients', '/vet/products']),
  GROOMER: new Set(['/professional', '/professional/agenda', '/professional/patients', '/professional/services']),
  SECRETARY: new Set(['/secretary', '/secretary/agenda', '/secretary/patients', '/secretary/reservations', '/secretary/products', '/secretary/clients', '/account']),
  ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
  SUPER_ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
};

export function shouldShowRouteBack(pathname: string, role?: string) {
  if (pathname === '/workspace') return false;
  return !(primaryRoutesByRole[role ?? '']?.has(pathname) ?? false);
}

/** Regresa a la pantalla anterior y usa el inicio del rol solo si no hay historial. */
export function useBackNavigation() {
  const pathname = usePathname();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { user } = useAuth();
  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    const fallback = roleHome(user);
    if (pathname !== fallback) router.replace(fallback as never);
  }, [pathname, user]);
  const shouldShowBack = pathname === '/account' && Boolean(section)
    ? true
    : shouldShowRouteBack(pathname, user?.role);
  return { goBack, shouldShowBack, pathname };
}
