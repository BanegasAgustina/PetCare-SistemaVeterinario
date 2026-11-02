/**
 * ARCHIVO: clinic.ts
 * UBICACIÓN: mobile/src/types/clinic.ts
 * FUNCIÓN: Tipos y contratos TypeScript.
 * RESPONSABILIDAD: Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de clinic.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/admin/SpecialtiesScreen.tsx, mobile/src/components/clinic/CatalogScreen.tsx, mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientListCard.tsx, mobile/src/components/clinic/PatientsScreen.tsx, mobile/src/services/clinic.service.ts
 * FUNCIONAMIENTO: Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Contratos de la clínica compartida; las listas funcionales vienen exclusivamente de API. */
/** Fila flexible de catálogo con ID estable y valores escalares entregados por API. */
export type ClinicRow={id:string;[key:string]:string|number|boolean|null};
/** Conjunto de catálogos y asignaciones compartidos por pantallas de clínica. */
export type ClinicCatalog={types:ClinicRow[];services:ClinicRow[];specialties:ClinicRow[];professionals:ClinicRow[];assignments:ClinicRow[];categories:ClinicRow[];species:ClinicRow[];breeds:ClinicRow[]};
// El historial enumera transiciones de reserva ya autorizadas y registradas por el backend.
