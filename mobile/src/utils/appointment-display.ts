// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Valores defensivos para parámetros y datos opcionales de turnos devueltos por API. */
// Función appointmentRouteId: concentra la lógica dentro de este módulo.
export function appointmentRouteId(value:unknown):string|null {
  const id=typeof value==='string'?value:typeof value==='number'?String(value):'';
  return /^[1-9]\d{0,19}$/.test(id)?id:null;
}

// Función appointmentDisplayValue: concentra la lógica dentro de este módulo.
export function appointmentDisplayValue(value:unknown,fallback:string):string {
  if(typeof value==='string'&&value.trim())return value.trim();
  if(typeof value==='number'&&Number.isFinite(value))return String(value);
  return fallback;
}
