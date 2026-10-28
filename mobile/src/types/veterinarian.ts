// Este archivo se encarga de lo siguiente: Tipos de TypeScript compartidos; describen la forma de los datos que maneja la app.

/** Datos de administración recibidos de la API: ningún catálogo se define en la app. */
// Tipo Specialty: define la forma o las opciones válidas de los datos usados por este módulo.
export type Specialty = { id: string; name: string; isActive?: boolean };
// Tipo VetCatalog: define la forma o las opciones válidas de los datos usados por este módulo.
export type VetCatalog = { specialties: Specialty[] };
// Tipo VetSummary: define la forma o las opciones válidas de los datos usados por este módulo.
export type VetSummary = { id: string; firstName: string; lastName: string; email: string; profilePhotoUrl:string|null; licenseNumber: string; isActive: boolean; specialties: Specialty[] };
// Tipo VetDetail: define la forma o las opciones válidas de los datos usados por este módulo.
export type VetDetail = VetSummary & { userId: string; phone: string | null; emailVerified: boolean; invitationStatus: string };
// Tipo VetPage: define la forma o las opciones válidas de los datos usados por este módulo.
export type VetPage = { items: VetSummary[]; page: number; pageSize: number; total: number; hasMore: boolean };
// Tipo VetValues: define la forma o las opciones válidas de los datos usados por este módulo.
export type VetValues = { firstName: string; lastName: string; email: string; phone: string; licenseNumber: string; isActive: boolean;
  specialtyIds: string[] };
