/**
 * ARCHIVO: notification-path.ts
 * UBICACIÓN: mobile/src/services/notification-path.ts
 * FUNCIÓN: Clasifica eventos de notificación y resuelve su destino de navegación.
 * RESPONSABILIDAD: Compartir reglas de contexto personal/laboral y enlaces a las entidades relacionadas.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/notifications.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx
 * FUNCIONAMIENTO: Reconoce eventos WORK_, valida IDs numéricos positivos y deriva la pantalla según tipo de referencia, rol y evento.
 * IMPORTANCIA: Mantiene consistentes los filtros y la navegación desde notificaciones para clientes y profesionales.
 */
/** Ruta base de la bandeja cuando el evento no tiene un destino reconocible. */
export const notificationCenterPath='/notifications';

/** Las notificaciones cuyo tipo empieza por WORK_ pertenecen a la actividad profesional. */
export function isWorkNotification(eventType:unknown):boolean {
  return typeof eventType==='string'&&eventType.startsWith('WORK_');
}

/** Decide si el evento pertenece al filtro completo, laboral o personal seleccionado. */
export function notificationMatchesContext(eventType:unknown,context:'all'|'personal'|'work'):boolean {
  return context==='all'||(context==='work'?isWorkNotification(eventType):!isWorkNotification(eventType));
}

/** Mapea referencias a rutas tipadas; el ID debe ser una cadena numérica positiva. */
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
