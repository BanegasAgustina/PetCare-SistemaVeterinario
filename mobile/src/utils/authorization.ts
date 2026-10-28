// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/**
 * Evalúa roles y permisos recibidos por /auth/me para presentar la interfaz. La autorización definitiva y el ownership se repiten siempre en backend.
 */
import type { AuthUser } from '../types/auth';
/** Helpers de presentación. La autorización definitiva siempre se repite en backend. */
// Función hasRole: comprueba una regla o condición dentro de este módulo.
export function hasRole(user:AuthUser|null,...roles:AuthUser['role'][]):boolean {
  return Boolean(user&&roles.includes(user.role));
}
// Función hasPermission: comprueba una regla o condición dentro de este módulo.
export function hasPermission(user:AuthUser|null,...codes:string[]):boolean {
  return Boolean(user&&codes.every(code=>user.permissions?.includes(code)));
}
