// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

import { createContext,useContext,type PropsWithChildren } from 'react';
import type { NavigationTab } from './RoleBottomNavigation';

// Dato RoleQuickAccessContext: conserva un valor calculado o de configuración usado por este módulo.
const RoleQuickAccessContext=createContext<NavigationTab[]>([]);

// Función RoleQuickAccessProvider: concentra la lógica dentro de este módulo.
export function RoleQuickAccessProvider({items,children}:{items:NavigationTab[]}&PropsWithChildren){
  return <RoleQuickAccessContext.Provider value={items}>{children}</RoleQuickAccessContext.Provider>;
}

// Función useRoleQuickAccess: concentra la lógica dentro de este módulo.
export function useRoleQuickAccess(){return useContext(RoleQuickAccessContext);}
