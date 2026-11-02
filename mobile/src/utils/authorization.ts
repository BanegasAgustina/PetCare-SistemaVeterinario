/**
 * ARCHIVO: authorization.ts
 * UBICACIÓN: mobile/src/utils/authorization.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de authorization.
 * CONEXIONES: Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/contexts/AuthContext.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Evalúa roles y permisos recibidos por /auth/me para presentar la interfaz. La autorización definitiva y el ownership se repiten siempre en backend.
 */
import type { AuthUser } from '../types/auth';
/** Helpers de presentación. La autorización definitiva siempre se repite en backend. */
/** Comprueba si la sesión tiene uno de los roles indicados; sin usuario devuelve false. La API sigue siendo autoridad final. */
export function hasRole(user:AuthUser|null,...roles:AuthUser['role'][]):boolean {
  return Boolean(user&&roles.includes(user.role));
}
/** Exige que la sesión incluya todos los códigos solicitados; sin usuario devuelve false. El backend revalida cada operación. */
export function hasPermission(user:AuthUser|null,...codes:string[]):boolean {
  return Boolean(user&&codes.every(code=>user.permissions?.includes(code)));
}
