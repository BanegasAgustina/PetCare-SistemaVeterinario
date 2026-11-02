/**
 * ARCHIVO: useBackNavigation.ts
 * UBICACIÓN: mobile/src/hooks/useBackNavigation.ts
 * FUNCIÓN: Hook de React para compartir estado o comportamiento.
 * RESPONSABILIDAD: Hook de React para compartir estado o comportamiento dentro de PetCare; agrupa las declaraciones de useBackNavigation.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/utils/back-navigation.ts Se utiliza desde: mobile/src/components/admin/AdminPageHeading.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/layout/BackButton.tsx, mobile/src/components/layout/GlobalNavigation.tsx
 * FUNCIONAMIENTO: Combina estado y ciclo de vida de React con dependencias del dominio y expone datos o acciones.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import { useCallback } from 'react';
import { router, useLocalSearchParams, usePathname } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { backControlPlacement, backNavigationAction } from '../utils/back-navigation';

/** Combina ruta, sección y rol para volver en historial o reemplazar por inicio; también informa quién dibuja el botón. */
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
