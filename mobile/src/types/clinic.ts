/** Contratos de la clínica compartida; las listas funcionales vienen exclusivamente de API. */
export type ClinicRow={id:string;[key:string]:string|number|boolean|null};
export type ClinicCatalog={types:ClinicRow[];services:ClinicRow[];specialties:ClinicRow[];professionals:ClinicRow[];assignments:ClinicRow[];categories:ClinicRow[];species:ClinicRow[]};
export type Reservation=ClinicRow&{items?:ClinicRow[]};
