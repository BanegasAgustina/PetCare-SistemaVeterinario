// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

// Función notificationPath: concentra la lógica dentro de este módulo.
// Propósito: Servicio de la app móvil; agrupa comunicación con la API o manejo de sesión y eventos.

// Función notificationPath: concentra la lógica dentro de este módulo.
export const notificationCenterPath='/notifications';

export function isWorkNotification(eventType:unknown):boolean {
  return typeof eventType==='string'&&eventType.startsWith('WORK_');
}

export function notificationMatchesContext(eventType:unknown,context:'all'|'personal'|'work'):boolean {
  return context==='all'||(context==='work'?isWorkNotification(eventType):!isWorkNotification(eventType));
}

export function notificationPath(referenceType: unknown, referenceId: unknown,eventType?:unknown,role?:string,_permissions?:string[]): string | { pathname: string; params: { id: string } } {
  const id = typeof referenceId === 'string' && /^[1-9]\d*$/.test(referenceId) ? referenceId : '';
  if ((referenceType === 'reservation' || referenceType === 'order') && id) return { pathname: '/client/orders/[id]', params: { id } };
  if(referenceType==='appointment'){
    const professional=['VETERINARIAN','GROOMER'].includes(role??'');
    if(professional&&isWorkNotification(eventType))return id?{pathname:role==='VETERINARIAN'?'/vet/appointment':'/professional/appointment',params:{id}}:role==='VETERINARIAN'?'/vet/agenda':'/professional/agenda';
    if(id)return { pathname: '/client/appointments/[id]', params: { id } };
    if(professional)return '/client/appointments';
  }
  if (referenceType === 'appointment') return '/client/appointments';
  if (referenceType === 'pet' && id) return { pathname: '/client/pets/[id]', params: { id } };
  return notificationCenterPath;
}
