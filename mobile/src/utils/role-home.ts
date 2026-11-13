/**
 * ARCHIVO: role-home.ts
 * UBICACIÓN: mobile/src/utils/role-home.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de role-home.
 * CONEXIONES: Importa: mobile/src/types/auth.ts, mobile/src/utils/capability-modules.ts, mobile/src/utils/personal-route-access.ts Se utiliza desde: mobile/src/app/_layout.tsx, mobile/src/app/client/_layout.tsx, mobile/src/app/oauth.tsx, mobile/src/components/layout/EntryRedirect.tsx, mobile/src/components/profile/AccountProfileScreen.tsx, mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/utils/back-navigation.ts
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Selecciona el panel usando el rol de /auth/me. No deduce privilegios por email ni ID.
 */
import type { AuthUser } from '../types/auth';
import { hasAdministrativeShellCapability, hasCapabilityModule, hasPersonalCapabilityModule } from './capability-modules';
import { canAccessNotificationCenter } from './personal-route-access';
/** Derives the clinical workspace from the persisted professional profile, including custom role codes. */
export function isClinicalProfessional(user:Pick<AuthUser,'professional'>|null):boolean {
  return Boolean(user?.professional?.isClinical);
}
/** Personal capabilities do not turn a staff account into a CLIENT account. */
export function isClientAccount(user:Pick<AuthUser,'role'>|null):boolean {
  return user?.role==='CLIENT';
}
/** Elige un shell compatible con las capacidades recibidas del backend. */
export function roleHome(user: AuthUser | null): '/login' | '/client' | '/vet' | '/admin' | '/professional' | '/workspace' {
  if (!user) return '/login';
  if (user.professional) return isClinicalProfessional(user) ? '/vet' : '/professional';
  if (hasAdministrativeShellCapability(user.permissions)) return '/admin';
  if (hasPersonalCapabilityModule(user.permissions)) return '/client';
  return '/workspace';
}

/** Mantener el destino de entrada y los guards del árbol raíz bajo la misma regla. */
/** Permite el espacio personal a CLIENT, roles con módulos personales o roles de producto con acceso a notificaciones. */
export function canEnterClientRoot(user:AuthUser|null):boolean {
  return hasPersonalCapabilityModule(user?.permissions)||canAccessNotificationCenter(user?.role??'');
}
/** Permite el workspace a quien tenga permisos, para mostrar sus accesos autorizados. */
export function canEnterWorkspace(user:AuthUser|null):boolean {
  return Boolean(user&&!hasPersonalCapabilityModule(user.permissions)&&!hasCapabilityModule(user.permissions)&&!user.professional);
}
