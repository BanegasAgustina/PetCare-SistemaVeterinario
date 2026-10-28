// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Las fechas operativas pertenecen a la clínica de Argentina, independientemente del teléfono. */
// Función clinicInstant: concentra la lógica dentro de este módulo.
export function clinicInstant(value:string):string|null {
 const m=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value.trim());if(!m)return null;
 const iso=`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00-03:00`;const d=new Date(iso);
 if(!Number.isFinite(d.getTime())||Number(m[4])>23||Number(m[5])>59)return null;
 const local=new Date(d.getTime()-3*3600000).toISOString();if(local.slice(0,10)!==`${m[3]}-${m[2]}-${m[1]}`)return null;return d.toISOString();
}
// Dato clinicTimezone: conserva un valor calculado o de configuración usado por este módulo.
const clinicTimezone='America/Argentina/Buenos_Aires';
// Función clinicDateParts: concentra la lógica dentro de este módulo.
function clinicDateParts(value:Date):Record<string,string> {
 return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:clinicTimezone,day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(value).map(part=>[part.type,part.value]));
}
// Función clinicToday: concentra la lógica dentro de este módulo.
export function clinicToday():string {
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:clinicTimezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
// Función clinicDate: concentra la lógica dentro de este módulo.
export function clinicDate(value:string):string {
 const source=value.trim();const dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(source);
 const parsed=new Date(dateOnly?`${source}T12:00:00-03:00`:source);
 if(!Number.isFinite(parsed.getTime()))return value;
 const parts=clinicDateParts(parsed);return `${parts.day}/${parts.month}/${parts.year}`;
}
/** Convierte una fecha visible DD/MM/AAAA al formato YYYY-MM-DD que esperan los filtros del API. */
// Función clinicDateFilterToApi: concentra la lógica dentro de este módulo.
export function clinicDateFilterToApi(value:string):string {
 const source=value.trim();const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(source);if(!match)return source;
 const [,day,month,year]=match;const date=new Date(`${year}-${month}-${day}T12:00:00-03:00`);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==`${year}-${month}-${day}`)return source;
 return `${year}-${month}-${day}`;
}
// Función clinicDateTime: concentra la lógica dentro de este módulo.
export function clinicDateTime(value:string):string {
 const parsed=new Date(value);if(!Number.isFinite(parsed.getTime()))return value;
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:clinicTimezone,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(parsed);
 // Función part: agrupa una operación que este módulo puede ejecutar o reutilizar.
const part=(type:string)=>parts.find(item=>item.type===type)?.value??'';
 return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}
