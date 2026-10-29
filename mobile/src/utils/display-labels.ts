/** Etiquetas de presentación para estados internos. Nunca modifica códigos de API. */
const appointmentStatuses: Record<string, string> = {
  REQUESTED: 'Solicitado',
  CONFIRMED: 'Confirmado',
  REJECTED: 'Rechazado',
  IN_PROGRESS: 'En atención',
  COMPLETED: 'Finalizado',
  CANCELLED: 'Cancelado',
};

const orderStatuses: Record<string, string> = {
  PLACED: 'Recibido',
  CONFIRMED: 'Confirmado',
  PROCESSING: 'En preparación',
  READY: 'Listo para retirar',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  PICKED_UP: 'Retirado',
  CANCELLED: 'Cancelado',
  COMPLETED: 'Completado',
  REQUESTED: 'Solicitado',
  REJECTED: 'Rechazado',
};

const reservationStatuses: Record<string, string> = {
  PLACED: 'Solicitada',
  CONFIRMED: 'Confirmada',
  PROCESSING: 'En preparación',
  READY: 'Lista para retirar',
  COMPLETED: 'Completada',
  CANCELLED: 'Cancelada',
  EXPIRED: 'Vencida',
};

const paymentStatuses: Record<string, string> = {
  NOT_APPLICABLE: 'No corresponde',
  DEMO_NOT_PAID: 'No realizado',
  PENDING: 'Pendiente',
  PENDING_VERIFICATION: 'Pendiente de verificación',
  PAID: 'Pagado',
  FAILED: 'Fallido',
  PAYMENT_FAILED: 'Fallido',
  REFUNDED: 'Reembolsado',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
  SUBMITTED: 'En revisión',
  EXPIRED: 'Vencido',
};

const deliveryStatuses: Record<string, string> = {
  NOT_APPLICABLE: 'No corresponde',
  PENDING: 'Pendiente',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  PICKED_UP: 'Retirado',
  CANCELLED: 'Cancelado',
};

const generalStatuses: Record<string, string> = {
  ...appointmentStatuses,
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  UNKNOWN: 'Estado no disponible',
  AVAILABLE: 'Disponible',
  UNAVAILABLE: 'No disponible',
  APPROVED: 'Aprobado',
  PENDING: 'Pendiente',
  FAILED: 'Fallido',
  LOADING: 'Cargando',
};

const paymentMethods: Record<string, string> = {
  BANK_TRANSFER: 'Transferencia bancaria',
  CARD_DEMO: 'Tarjeta de demostración',
};

const historyTypes: Record<string, string> = {
  ORDER: 'Pedido',
  PAYMENT: 'Pago',
  DELIVERY: 'Entrega',
};

function labelFrom(map: Record<string, string>, value: string, fallback: string): string {
  return map[value.toUpperCase()] ?? fallback;
}

export const appointmentStatusLabel = (value: string): string => labelFrom(appointmentStatuses, value, 'Estado del turno no disponible');
export const orderStatusLabel = (value: string): string => labelFrom(orderStatuses, value, 'Estado del pedido no disponible');
export const reservationStatusLabel = (value: string): string => labelFrom(reservationStatuses, value, 'Estado de la reserva no disponible');
export const paymentStatusLabel = (value: string): string => labelFrom(paymentStatuses, value, 'Estado del pago no disponible');
export const deliveryStatusLabel = (value: string): string => labelFrom(deliveryStatuses, value, 'Estado de entrega no disponible');
export const generalStatusLabel = (value: string): string => labelFrom(generalStatuses, value, 'Estado no disponible');
export const paymentMethodLabel = (value: string | null): string => value ? paymentMethods[value.toUpperCase()] ?? 'Método de pago no disponible' : 'Sin método';
export const historyTypeLabel = (value: string): string => labelFrom(historyTypes, value, 'Movimiento');
export const historyStatusLabel = (type: string, value: string | null): string => {
  if (value === null) return '—';
  switch (type.toUpperCase()) {
    case 'PAYMENT': return paymentStatusLabel(value);
    case 'DELIVERY': return deliveryStatusLabel(value);
    default: return orderStatusLabel(value);
  }
};
