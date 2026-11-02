/**
 * ARCHIVO: clinic-rules.ts
 * UBICACIÓN: backend/src/utils/clinic-rules.ts
 * FUNCIÓN: Reglas puras de transición de turno, orden y conflicto de intervalos.
 * RESPONSABILIDAD: Compartir invariantes clínicas entre operaciones de repositorio.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts
 * FUNCIONAMIENTO: Define transiciones permitidas, filtra turnos próximos, valida estados y compara intervalos solapados.
 * IMPORTANCIA: Evita aceptar cambios de agenda incompatibles con el estado actual.
 */
/** Reglas compartidas por API y tests; estados del dominio, no datos de demostración. */
import { AppError } from './app-error';
// Estados destinos válidos para cada estado actual de turno.
export const appointmentTransitions:Record<string,string[]>={REQUESTED:['CONFIRMED','REJECTED','CANCELLED'],CONFIRMED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED'],REJECTED:[],COMPLETED:[],CANCELLED:[]};
const activeAppointmentStatuses=new Set(['REQUESTED','CONFIRMED','IN_PROGRESS']);
/** Conserva el orden cronológico recibido por el repositorio y excluye turnos cerrados del panel profesional. */
export function professionalUpcomingAppointments<T extends {status?:unknown}>(items:T[]):T[] {
 return items.filter(item=>activeAppointmentStatuses.has(String(item.status))).slice(0,5);
}
/** Lanza error si el estado destino no está permitido para el turno actual. */
export function assertTransition(current:string,next:string) {
  if(!appointmentTransitions[current]?.includes(next))throw new AppError('INVALID_TRANSITION',409,'El estado cambió o la transición no está permitida.');
}
/** Comprueba intersección de dos intervalos semiabiertos de tiempo. */
export function overlap(start:string,end:string,otherStart:string,otherEnd:string) {return start<otherEnd&&end>otherStart;}
