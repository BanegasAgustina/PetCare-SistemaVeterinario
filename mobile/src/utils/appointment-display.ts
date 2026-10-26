/** Valores defensivos para parámetros y datos opcionales de turnos devueltos por API. */
export function appointmentRouteId(value:unknown):string|null {
  const id=typeof value==='string'?value:typeof value==='number'?String(value):'';
  return /^[1-9]\d{0,19}$/.test(id)?id:null;
}

export function appointmentDisplayValue(value:unknown,fallback:string):string {
  if(typeof value==='string'&&value.trim())return value.trim();
  if(typeof value==='number'&&Number.isFinite(value))return String(value);
  return fallback;
}
