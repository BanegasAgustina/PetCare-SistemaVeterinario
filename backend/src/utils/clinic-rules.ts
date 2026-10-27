/** Reglas compartidas por API y tests; estados del dominio, no datos de demostración. */
import { AppError } from './app-error';
export const appointmentTransitions:Record<string,string[]>={REQUESTED:['CONFIRMED','REJECTED','CANCELLED'],CONFIRMED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED'],REJECTED:[],COMPLETED:[],CANCELLED:[]};
export function assertTransition(current:string,next:string) {
  if(!appointmentTransitions[current]?.includes(next))throw new AppError('INVALID_TRANSITION',409,'El estado cambió o la transición no está permitida.');
}
export function overlap(start:string,end:string,otherStart:string,otherEnd:string) {return start<otherEnd&&end>otherStart;}
