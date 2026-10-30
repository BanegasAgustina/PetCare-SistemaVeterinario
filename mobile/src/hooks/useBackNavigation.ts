// Este archivo se encarga de lo siguiente: Hook reutilizable de React; concentra estado o comportamiento que pueden compartir varias pantallas.

import { useCallback } from 'react';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { backControlPlacement, backNavigationAction } from '../utils/back-navigation';

/** Regresa a la pantalla anterior y usa el inicio del rol solo si no hay historial. */
// Función useBackNavigation: concentra la lógica dentro de este módulo.
export function useBackNavigation() {
  const pathname = usePathname();
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { user } = useAuth();
  const goBack = useCallback(() => {
    const action=backNavigationAction(router.canGoBack(),pathname,user);
    if(action.type==='back')router.back();
    else if(action.type==='replace')router.replace(action.path as never);
  }, [pathname, user]);
  const backPlacement = pathname === '/account' && Boolean(section)
    ? 'screen'
    : backControlPlacement(pathname, user?.role);
  return { goBack, shouldShowBack: backPlacement !== 'none', backPlacement, pathname };
}
