// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Convierte una etiqueta legible en un código estable aceptado por roles.code. */
// Función roleCodeFromName: concentra la lógica dentro de este módulo.
export function roleCodeFromName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32).replace(/_+$/g, '');
}
