/** Reglas compartidas por API y tests; estados del dominio, no datos de demostración. */
import { AppError } from './app-error';
export const appointmentTransitions:Record<string,string[]>={REQUESTED:['CONFIRMED','CANCELLED'],CONFIRMED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
export const reservationTransitions:Record<string,string[]>={PLACED:['CONFIRMED','CANCELLED'],CONFIRMED:['PROCESSING','CANCELLED'],PROCESSING:['READY','CANCELLED'],READY:['COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
export function assertTransition(current:string,next:string,kind:'appointment'|'reservation') {
  if(!(kind==='appointment'?appointmentTransitions:reservationTransitions)[current]?.includes(next))throw new AppError('INVALID_TRANSITION',409,'El estado cambió o la transición no está permitida.');
}
export function availableStock(stock:number,reserved:number) {return stock-reserved;}
export function overlap(start:string,end:string,otherStart:string,otherEnd:string) {return start<otherEnd&&end>otherStart;}
