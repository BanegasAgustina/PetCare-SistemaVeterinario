export function notificationPath(referenceType: unknown, referenceId: unknown): string | { pathname: '/client/orders/[id]' | '/client/pets/[id]' | '/client/appointments/[id]'; params: { id: string } } {
  const id = typeof referenceId === 'string' && /^[1-9]\d*$/.test(referenceId) ? referenceId : '';
  if ((referenceType === 'reservation' || referenceType === 'order') && id) return { pathname: '/client/orders/[id]', params: { id } };
  if (referenceType === 'appointment' && id) return { pathname: '/client/appointments/[id]', params: { id } };
  if (referenceType === 'pet' && id) return { pathname: '/client/pets/[id]', params: { id } };
  if (referenceType === 'appointment') return '/client/appointments';
  return '/client/notifications';
}
