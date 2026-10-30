/** Normaliza consultas de catálogos para búsquedas insensibles a mayúsculas y diacríticos. */
export const normalizeSearchTerm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
