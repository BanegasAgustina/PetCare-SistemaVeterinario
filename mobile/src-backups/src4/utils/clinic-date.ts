/** Las fechas operativas pertenecen a la clínica de Argentina, independientemente del teléfono. */
export function clinicInstant(value:string):string|null {
 const m=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/.exec(value.trim());if(!m)return null;
 const iso=`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00-03:00`;const d=new Date(iso);
 if(!Number.isFinite(d.getTime())||Number(m[4])>23||Number(m[5])>59)return null;
 const local=new Date(d.getTime()-3*3600000).toISOString();if(local.slice(0,10)!==`${m[3]}-${m[2]}-${m[1]}`)return null;return d.toISOString();
}
export const clinicDateTime=(value:string)=>new Date(value).toLocaleString('es-AR',{timeZone:'America/Argentina/Buenos_Aires',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'});
