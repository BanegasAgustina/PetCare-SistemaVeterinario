/**
 * ARCHIVO: notification-date.ts
 * UBICACIÓN: backend/src/utils/notification-date.ts
 * FUNCIÓN: Formatea fecha y hora para el texto de notificaciones.
 * RESPONSABILIDAD: Convertir una fecha de evento válida a etiquetas legibles en español argentino.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts, backend/src/services/notifications.service.ts
 * FUNCIONAMIENTO: Analiza valor desconocido, aplica Intl.DateTimeFormat y devuelve fecha/hora, usando fallback si no es válido.
 * IMPORTANCIA: Mantiene formato homogéneo de notificaciones generadas en distintos flujos.
 */
// Este archivo se encarga de convertir las fechas de notificaciones al formato local que muestra la aplicación.

/** Formatea una marca de tiempo en fecha y hora de locale es-AR. */
export function formatNotificationDateTime(value: unknown): { date: string; time: string } {
  const input = value instanceof Date
    ? value
    : typeof value === 'string'
      ? new Date(/[zZ]|[+-]\d{2}:\d{2}$/.test(value) ? value : `${value.replace(' ', 'T')}Z`)
      : new Date(Number.NaN);
  if (Number.isNaN(input.getTime())) throw new Error('La fecha almacenada para la notificación no es válida.');
  const parts = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(input);
  // Extrae una unidad ya formateada o entrega texto vacío si no existe.
const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return { date: `${part('day')}/${part('month')}/${part('year')}`, time: `${part('hour')}:${part('minute')}` };
}
