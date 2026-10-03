/** Fechas civiles: nunca convertir nacimiento mediante UTC. */
export function dateToApi(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function dateFromApi(value: string): Date {
  const [year,month,day]=value.split('-').map(Number);
  const date=new Date(0);date.setFullYear(year,month-1,day);date.setHours(12,0,0,0);return date;
}
export function displayPetDate(value: string): string {
  return value ? value.split('-').reverse().join('/') : '';
}
export function validPetDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && dateToApi(dateFromApi(value))===value && value<=dateToApi(new Date());
}
