/**
 * ARCHIVO: search-normalization.ts
 * UBICACIÓN: mobile/src/utils/search-normalization.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de search-normalization.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/forms/AppSelectField.tsx, mobile/src/components/forms/SearchableMultiSelect.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Normaliza consultas de catálogos para búsquedas insensibles a mayúsculas y diacríticos. */
export const normalizeSearchTerm=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
