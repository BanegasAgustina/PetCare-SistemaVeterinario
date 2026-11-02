/**
 * ARCHIVO: EntryRedirect.tsx
 * UBICACIÓN: mobile/src/components/layout/EntryRedirect.tsx
 * FUNCIÓN: Redirección inicial de la app según identidad autenticada y rol.
 * RESPONSABILIDAD: Enviar al usuario a la entrada de cliente, profesional o autenticación.
 * CONEXIONES: Importa: mobile/src/types/auth.ts, mobile/src/utils/role-home.ts Se utiliza desde: mobile/src/app/index.tsx
 * FUNCIONAMIENTO: Recibe el usuario validado por AuthContext y transforma roleHome en un componente Redirect compatible.
 * IMPORTANCIA: Evita mostrar el índice genérico a usuarios con sesión activa.
 */
import type { ComponentType } from 'react';
import type { AuthUser } from '../../types/auth';
import { roleHome } from '../../utils/role-home';

/** Envía al usuario autenticado a la pantalla inicial que corresponde a su rol. */
export function EntryRedirect({user,RedirectComponent}:{user:AuthUser|null;RedirectComponent:ComponentType<{href:string}>}) {
  return <RedirectComponent href={roleHome(user)} />;
}
