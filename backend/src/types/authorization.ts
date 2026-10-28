// Este archivo se encarga de lo siguiente: Tipos de TypeScript que describen datos usados por la aplicación.

/** Catálogos de MySQL y resolución explícita de herencia. */
// Tipo Permission: define la forma o las opciones válidas de datos usados por este módulo.
export type Permission = { code: string; name: string; description: string; module: string; inherited: boolean; override: boolean | null; effective: boolean };
// Tipo Specialty: define la forma o las opciones válidas de datos usados por este módulo.
export type Specialty = { id: string; name: string };
// Tipo VetProfile: define la forma o las opciones válidas de datos usados por este módulo.
export type VetProfile = { id: string; licenseNumber: string; professionalDescription:string|null; specialties: Specialty[] };
// Función effectivePermission: concentra la lógica dentro de este módulo.
export function effectivePermission(inherited: boolean, override: boolean | null): boolean {
  return override === null ? inherited : override;
}
// Función effectiveRolePermission: concentra la lógica dentro de este módulo.
export function effectiveRolePermission(role:string,critical:boolean,inherited:boolean,override:boolean|null):boolean {
  return (!critical||['ADMIN','SUPER_ADMIN'].includes(role))&&effectivePermission(inherited,override);
}
