// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Reglas compartidas por API y tests; estados del dominio, no datos de demostración. */
import { AppError } from './app-error';
// Configuración appointmentTransitions: reúne valores o reglas que consume el resto del módulo.
export const appointmentTransitions:Record<string,string[]>={REQUESTED:['CONFIRMED','REJECTED','CANCELLED'],CONFIRMED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED'],REJECTED:[],COMPLETED:[],CANCELLED:[]};
const activeAppointmentStatuses=new Set(['REQUESTED','CONFIRMED','IN_PROGRESS']);
/** Conserva el orden cronológico recibido por el repositorio y excluye turnos cerrados del panel profesional. */
export function professionalUpcomingAppointments<T extends {status?:unknown}>(items:T[]):T[] {
 return items.filter(item=>activeAppointmentStatuses.has(String(item.status))).slice(0,5);
}
// Función assertTransition: comprueba una regla o condición dentro de este módulo.
export function assertTransition(current:string,next:string) {
  if(!appointmentTransitions[current]?.includes(next))throw new AppError('INVALID_TRANSITION',409,'El estado cambió o la transición no está permitida.');
}
// Función overlap: concentra la lógica dentro de este módulo.
export function overlap(start:string,end:string,otherStart:string,otherEnd:string) {return start<otherEnd&&end>otherStart;}
