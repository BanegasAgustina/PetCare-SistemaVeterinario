/**
 * ARCHIVO: veterinarian.ts
 * UBICACIÓN: mobile/src/types/veterinarian.ts
 * FUNCIÓN: Tipos y contratos TypeScript.
 * RESPONSABILIDAD: Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de veterinarian.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/veterinarians/[id].tsx, mobile/src/app/admin/veterinarians/index.tsx, mobile/src/components/admin/SpecialtiesScreen.tsx
 * FUNCIONAMIENTO: Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Datos de administración recibidos de la API: ningún catálogo se define en la app. */
/** Especialidad del catálogo, con estado opcional para interfaces administrativas. */
export type Specialty = { id: string; name: string; isActive?: boolean };
/** Catálogo de especialidades cargado desde la API. */
export type VetCatalog = { specialties: Specialty[] };
/** Datos de lista del veterinario junto con matrícula, estado y especialidades. */
export type VetSummary = { id: string; firstName: string; lastName: string; email: string; profilePhotoUrl:string|null; licenseNumber: string; isActive: boolean; specialties: Specialty[] };
/** Detalle ampliado con datos de cuenta, contacto e invitación. */
export type VetDetail = VetSummary & { userId: string; phone: string | null; emailVerified: boolean; invitationStatus: string };
/** Página de veterinarios con metadatos de paginación. */
export type VetPage = { items: VetSummary[]; page: number; pageSize: number; total: number; hasMore: boolean };
/** Valores editables del formulario; specialtyIds se envía como lista de IDs. */
export type VetValues = { firstName: string; lastName: string; email: string; phone: string; licenseNumber: string; isActive: boolean;
  specialtyIds: string[] };
