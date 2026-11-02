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
import { hasPersonalCapabilityModule } from './capability-modules';
import { canAccessNotificationCenter } from './personal-route-access';
/** El rol es el contrato de navegación; la identidad nunca se decide por email o ID. */
/** Devuelve inicio por rol conocido; cuentas personalizadas usan workspace y una sesión nula vuelve a login. */
export function roleHome(user: AuthUser | null): '/login' | '/client' | '/vet' | '/admin' | '/professional' | '/workspace' {
  if (!user) return '/login';
  if (user.role==='CLIENT') return '/client';
  if (user.role==='VETERINARIAN') return '/vet';
  if (user.role==='GROOMER') return '/professional';
  if (user.role==='SUPER_ADMIN' || user.role==='ADMIN') return '/admin';
  return '/workspace';
}

/** Mantener el destino de entrada y los guards del árbol raíz bajo la misma regla. */
/** Permite el espacio personal a CLIENT, roles con módulos personales o roles de producto con acceso a notificaciones. */
export function canEnterClientRoot(user:AuthUser|null):boolean {
  return user?.role==='CLIENT'||hasPersonalCapabilityModule(user?.permissions)||canAccessNotificationCenter(user?.role??'');
}
/** Reconoce workspace para una sesión cuyo rol no sea uno de los cinco roles estándar. */
export function canEnterWorkspace(user:AuthUser|null):boolean {
  return Boolean(user&&!['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN'].includes(user.role));
}
