// Este archivo se encarga de lo siguiente: Tipos de TypeScript compartidos; describen la forma de los datos que maneja la app.

/** Contratos de la clínica compartida; las listas funcionales vienen exclusivamente de API. */
// Tipo ClinicRow: define la forma o las opciones válidas de los datos usados por este módulo.
export type ClinicRow={id:string;[key:string]:string|number|boolean|null};
// Tipo ClinicCatalog: define la forma o las opciones válidas de los datos usados por este módulo.
export type ClinicCatalog={types:ClinicRow[];services:ClinicRow[];specialties:ClinicRow[];professionals:ClinicRow[];assignments:ClinicRow[];categories:ClinicRow[];species:ClinicRow[];breeds:ClinicRow[]};
// El historial enumera transiciones de reserva ya autorizadas y registradas por el backend.
