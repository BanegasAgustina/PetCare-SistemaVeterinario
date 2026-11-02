/**
 * ARCHIVO: RoleNavigationContext.tsx
 * UBICACIÓN: mobile/src/components/layout/RoleNavigationContext.tsx
 * FUNCIÓN: Contexto para compartir accesos rápidos del rol en el árbol de navegación.
 * RESPONSABILIDAD: Proveer el conjunto actual de pestañas a navegación global y accesos rápidos.
 * CONEXIONES: Importa: mobile/src/components/layout/RoleBottomNavigation.tsx Se utiliza desde: mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/layout/RoleQuickAccess.tsx
 * FUNCIONAMIENTO: El provider publica items recibidos; el hook consumidor recupera el valor del contexto.
 * IMPORTANCIA: Evita pasar la configuración de navegación por múltiples niveles de componentes.
 */
import { createContext,useContext,type PropsWithChildren } from 'react';
import type { NavigationTab } from './RoleBottomNavigation';

// Dato RoleQuickAccessContext: conserva un valor calculado o de configuración usado por este módulo.
const RoleQuickAccessContext=createContext<NavigationTab[]>([]);

/** Publica los accesos rápidos para los componentes descendientes. */
export function RoleQuickAccessProvider({items,children}:{items:NavigationTab[]}&PropsWithChildren){
  return <RoleQuickAccessContext.Provider value={items}>{children}</RoleQuickAccessContext.Provider>;
}

/** Lee la lista de accesos rápidos que publicó el provider. */
export function useRoleQuickAccess(){return useContext(RoleQuickAccessContext);}
