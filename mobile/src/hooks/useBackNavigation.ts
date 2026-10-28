// Este archivo se encarga de lo siguiente: Hook reutilizable de React; concentra estado o comportamiento que pueden compartir varias pantallas.

import { useCallback } from 'react';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { roleHome } from '../utils/role-home';

// Configuración primaryRoutesByRole: reúne valores o reglas que consume el resto del módulo.
const primaryRoutesByRole: Record<string, Set<string>> = {
  CLIENT: new Set(['/client', '/client/pets', '/client/appointments', '/client/store', '/client/profile']),
  VETERINARIAN: new Set(['/vet', '/vet/agenda', '/vet/patients', '/vet/clients', '/vet/products']),
  GROOMER: new Set(['/professional', '/professional/agenda', '/professional/patients', '/professional/services']),
  ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
  SUPER_ADMIN: new Set(['/admin', '/admin/clinic', '/admin/store', '/admin/administration']),
};

// Función shouldShowRouteBack: concentra la lógica dentro de este módulo.
export function shouldShowRouteBack(pathname: string, role?: string) {
  if (pathname === '/workspace') return false;
  return !(primaryRoutesByRole[role ?? '']?.has(pathname) ?? false);
}

/** Regresa a la pantalla anterior y usa el inicio del rol solo si no hay historial. */
// Función useBackNavigation: concentra la lógica dentro de este módulo.
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
