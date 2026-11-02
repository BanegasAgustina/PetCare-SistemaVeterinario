/**
 * ARCHIVO: pet-date.ts
 * UBICACIÓN: mobile/src/utils/pet-date.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de pet-date.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/client/PetEditor.tsx, mobile/src/components/forms/CalendarDateField.tsx, mobile/src/components/forms/CalendarDateField.web.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Fechas civiles: nunca convertir nacimiento mediante UTC. */
/** Serializa una fecha civil local como YYYY-MM-DD, sin convertirla a UTC. */
export function dateToApi(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
/** Construye una fecha local al mediodía desde YYYY-MM-DD para evitar corrimientos por zona horaria. */
export function dateFromApi(value: string): Date {
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(0);date.setFullYear(year,month-1,day);date.setHours(12,0,0,0);return date;
}
/** Presenta YYYY-MM-DD como DD/MM/YYYY; devuelve cadena vacía si no hay fecha. */
export function displayPetDate(value: string): string {
  return value ? value.split('-').reverse().join('/') : '';
}
/** Acepta solo una fecha civil válida, con ida/vuelta exacta y no futura. */
export function validPetDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dateToApi(dateFromApi(value))===value && value<=dateToApi(new Date());
}
