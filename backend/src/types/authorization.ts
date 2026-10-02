/** Catálogos de MySQL y resolución explícita de herencia. */
export type Permission = { code: string; name: string; description: string; module: string; inherited: boolean; override: boolean | null; effective: boolean };
export type Specialty = { id: string; name: string };
export type VetProfile = { id: string; licenseNumber: string; specialties: Specialty[] };
export function effectivePermission(inherited: boolean, override: boolean | null): boolean {
  return override === null ? inherited : override;
}
