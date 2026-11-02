/**
 * ARCHIVO: authorization.ts
 * UBICACIÓN: backend/src/types/authorization.ts
 * FUNCIÓN: Contratos de permisos y perfiles profesionales más reglas de permiso efectivo.
 * RESPONSABILIDAD: Representar permisos heredados/override y datos profesionales para autorización.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/authorization.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/types/auth.ts
 * FUNCIONAMIENTO: Declara tipos Permission/Specialty/VetProfile y calcula effective según override y rol crítico.
 * IMPORTANCIA: Permite que UI y servicios interpreten permisos con una semántica única.
 */
/** Catálogos de MySQL y resolución explícita de herencia. */
/** Permiso con herencia, override y resultado efectivo. */
export type Permission = { code: string; name: string; description: string; module: string; inherited: boolean; override: boolean | null; effective: boolean };
/** Especialidad profesional disponible para asignación. */
export type Specialty = { id: string; name: string };
/** Perfil veterinario con matrícula, descripción y especialidades. */
export type VetProfile = { id: string; licenseNumber: string; professionalDescription:string|null; specialties: Specialty[] };
/** Override null hereda; true/false sustituye el permiso heredado. */
export function effectivePermission(inherited: boolean, override: boolean | null): boolean {
  return override === null ? inherited : override;
}
/** Aplica restricciones críticas de rol y la regla heredada/override. */
export function effectiveRolePermission(role:string,critical:boolean,inherited:boolean,override:boolean|null):boolean {
  return (!critical||['ADMIN','SUPER_ADMIN'].includes(role))&&effectivePermission(inherited,override);
}
