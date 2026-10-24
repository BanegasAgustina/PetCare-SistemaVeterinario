import { createContext,useContext,type PropsWithChildren } from 'react';
import type { NavigationTab } from './RoleBottomNavigation';

const RoleQuickAccessContext=createContext<NavigationTab[]>([]);

export function RoleQuickAccessProvider({items,children}:{items:NavigationTab[]}&PropsWithChildren){
  return <RoleQuickAccessContext.Provider value={items}>{children}</RoleQuickAccessContext.Provider>;
}

export function useRoleQuickAccess(){return useContext(RoleQuickAccessContext);}
