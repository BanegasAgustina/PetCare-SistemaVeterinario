// Este archivo se encarga de lo siguiente: Componente de estructura visual y navegación; define cómo se acomodan las pantallas.

import type { ComponentType } from 'react';
import type { AuthUser } from '../../types/auth';
import { roleHome } from '../../utils/role-home';

// Función EntryRedirect: concentra la lógica dentro de este módulo.
export function EntryRedirect({user,RedirectComponent}:{user:AuthUser|null;RedirectComponent:ComponentType<{href:string}>}) {
  return <RedirectComponent href={roleHome(user)} />;
}
