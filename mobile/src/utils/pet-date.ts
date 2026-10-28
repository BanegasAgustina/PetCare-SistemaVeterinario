// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Fechas civiles: nunca convertir nacimiento mediante UTC. */
// Función dateToApi: concentra la lógica dentro de este módulo.
export function dateToApi(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
// Función dateFromApi: concentra la lógica dentro de este módulo.
export function dateFromApi(value: string): Date {
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(0);date.setFullYear(year,month-1,day);date.setHours(12,0,0,0);return date;
}
// Función displayPetDate: concentra la lógica dentro de este módulo.
export function displayPetDate(value: string): string {
  return value ? value.split('-').reverse().join('/') : '';
}
// Función validPetDate: concentra la lógica dentro de este módulo.
export function validPetDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dateToApi(dateFromApi(value))===value && value<=dateToApi(new Date());
}
