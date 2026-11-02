/**
 * ARCHIVO: clinic-date.ts
 * UBICACIÓN: mobile/src/utils/clinic-date.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de clinic-date.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/index.tsx, mobile/src/app/client/appointments/request.tsx, mobile/src/components/client/PetBirthDate.tsx, mobile/src/components/client/PetBirthDate.web.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx, mobile/src/components/clinic/AgendaScreen.tsx, mobile/src/components/clinic/AppointmentScreen.tsx y 6 más
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Las fechas operativas pertenecen a la clínica de Argentina, independientemente del teléfono. */
/** Parsea DD/MM/AAAA HH:mm en hora argentina y devuelve ISO UTC; retorna null ante formato o fecha imposible. */
export function clinicInstant(value:string):string|null {
 const m=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value.trim());if(!m)return null;
 const iso=`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00-03:00`;const d=new Date(iso);
 if(!Number.isFinite(d.getTime())||Number(m[4])>23||Number(m[5])>59)return null;
 const local=new Date(d.getTime()-3*3600000).toISOString();if(local.slice(0,10)!==`${m[3]}-${m[2]}-${m[1]}`)return null;return d.toISOString();
}
// Dato clinicTimezone: conserva un valor calculado o de configuración usado por este módulo.
const clinicTimezone='America/Argentina/Buenos_Aires';
/** Obtiene las partes de fecha en la zona fija de la clínica, sin depender de la zona del dispositivo. */
function clinicDateParts(value:Date):Record<string,string> {
 return Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:clinicTimezone,day:'2-digit',month:'2-digit',year:'numeric'}).formatToParts(value).map(part=>[part.type,part.value]));
}
/** Devuelve la fecha actual de Buenos Aires en formato YYYY-MM-DD para calendarios y filtros. */
export function clinicToday():string {
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:clinicTimezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(part=>[part.type,part.value]));
 return `${parts.year}-${parts.month}-${parts.day}`;
}
/** Presenta un valor como DD/MM/AAAA en zona argentina; ante fecha inválida conserva el texto recibido. */
export function clinicDate(value:string):string {
 const source=value.trim();const dateOnly=/^\d{4}-\d{2}-\d{2}$/.test(source);
 const parsed=new Date(dateOnly?`${source}T12:00:00-03:00`:source);
 if(!Number.isFinite(parsed.getTime()))return value;
 const parts=clinicDateParts(parsed);return `${parts.day}/${parts.month}/${parts.year}`;
}
/** Convierte una fecha visible DD/MM/AAAA al formato YYYY-MM-DD que esperan los filtros del API. */
/** Convierte DD/MM/AAAA a YYYY-MM-DD después de validar el calendario; si no puede, conserva la entrada. */
export function clinicDateFilterToApi(value:string):string {
 const source=value.trim();const match=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(source);if(!match)return source;
 const [,day,month,year]=match;const date=new Date(`${year}-${month}-${day}T12:00:00-03:00`);
 if(!Number.isFinite(date.getTime())||date.toISOString().slice(0,10)!==`${year}-${month}-${day}`)return source;
 return `${year}-${month}-${day}`;
}
/** Formatea instante como DD/MM/AAAA HH:mm en Buenos Aires; conserva el texto original si la fecha no se parsea. */
export function clinicDateTime(value:string):string {
 const parsed=new Date(value);if(!Number.isFinite(parsed.getTime()))return value;
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:clinicTimezone,day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(parsed);
 // Recupera la parte solicitada de Intl y usa cadena vacía si esa parte no aparece.
const part=(type:string)=>parts.find(item=>item.type===type)?.value??'';
 return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}
