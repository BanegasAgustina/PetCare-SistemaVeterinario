/**
 * ARCHIVO: appointment-display.ts
 * UBICACIÓN: mobile/src/utils/appointment-display.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de appointment-display.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx, mobile/src/components/clinic/StaffHome.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Valores defensivos para parámetros y datos opcionales de turnos devueltos por API. */
/** Acepta un ID numérico/string positivo de hasta 20 dígitos; devuelve null para valores no aptos como parámetro de ruta. */
export function appointmentRouteId(value:unknown):string|null {
  const id=typeof value==='string'?value:typeof value==='number'?String(value):'';
  return /^[1-9]\d{0,19}$/.test(id)?id:null;
}

/** Presenta texto o número finito como cadena y usa el fallback para datos vacíos, no finitos o de tipo inesperado. */
export function appointmentDisplayValue(value:unknown,fallback:string):string {
  if(typeof value==='string'&&value.trim())return value.trim();
  if(typeof value==='number'&&Number.isFinite(value))return String(value);
  return fallback;
}
