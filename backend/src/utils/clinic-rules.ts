/** Reglas compartidas por API y tests; estados del dominio, no datos de demostración. */
import { AppError } from './app-error';
export const appointmentTransitions:Record<string,string[]>={REQUESTED:['CONFIRMED','CANCELLED'],CONFIRMED:['IN_PROGRESS','CANCELLED'],IN_PROGRESS:['COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
export const reservationTransitions:Record<string,string[]>={PLACED:['CONFIRMED','CANCELLED'],CONFIRMED:['PROCESSING','CANCELLED'],PROCESSING:['READY','CANCELLED'],READY:['COMPLETED','CANCELLED'],COMPLETED:[],CANCELLED:[]};
export function assertTransition(current:string,next:string,kind:'appointment'|'reservation') {
  if(!(kind==='appointment'?appointmentTransitions:reservationTransitions)[current]?.includes(next))throw new AppError('INVALID_TRANSITION',409,'El estado cambió o la transición no está permitida.');
}
export function availableStock(stock:number,reserved:number) {return stock-reserved;}
/** Solo se reservan productos tipificados en el inventario propio de PetCare. */
export function assertReservableProduct(productType:string) {if(!['GENERAL','MEDICINE','ACCESSORY'].includes(productType))throw new AppError('PRODUCT_UNAVAILABLE',409,'Este producto no está disponible para reservar.');}
/** Define cuándo una reserva todavía puede ser retirada o cancelada. */
export const activeReservationStatuses=['PLACED','CONFIRMED','PROCESSING','READY'];
/** Comprueba las transiciones del flujo de retiro con el vocabulario persistido por el sistema. */
export function assertReservationTransition(current:string,next:string,expiresAt:string|Date|null,now=Date.now()) {
 if(expiresAt&&new Date(expiresAt).getTime()<=now&&activeReservationStatuses.includes(current))throw new AppError('RESERVATION_EXPIRED',409,'La reserva venció y sus unidades fueron liberadas.');
 assertTransition(current,next,'reservation');
}
export function overlap(start:string,end:string,otherStart:string,otherEnd:string) {return start<otherEnd&&end>otherStart;}
