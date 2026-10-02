/** Datos de administración recibidos de la API: ningún catálogo se define en la app. */
export type Specialty = { id: string; name: string };
export type PermissionOption = { code: string; name: string; description: string; module: string; moduleName: string; critical: boolean; inherited: boolean };
export type VetCatalog = { specialties: Specialty[]; permissions: PermissionOption[] };
export type VetSummary = { id: string; firstName: string; lastName: string; email: string; licenseNumber: string; isActive: boolean; specialties: Specialty[] };
export type VetDetail = VetSummary & { userId: string; phone: string | null; emailVerified: boolean; invitationStatus: string;
  permissions: { code: string; inherited: boolean; override: boolean | null; effective: boolean }[] };
export type VetPage = { items: VetSummary[]; page: number; pageSize: number; total: number; hasMore: boolean };
export type VetValues = { firstName: string; lastName: string; email: string; phone: string; licenseNumber: string; isActive: boolean;
  specialtyIds: string[]; overrides: { code: string; allowed: boolean | null }[] };
