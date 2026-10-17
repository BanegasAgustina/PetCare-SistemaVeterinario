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
  const part = (type: string) => parts.find(item => item.type === type)?.value ?? '';
  return { date: `${part('day')}/${part('month')}/${part('year')}`, time: `${part('hour')}:${part('minute')}` };
}
