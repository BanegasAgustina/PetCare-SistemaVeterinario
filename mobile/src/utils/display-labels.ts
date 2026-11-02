/**
 * ARCHIVO: display-labels.ts
 * UBICACIÓN: mobile/src/utils/display-labels.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de display-labels.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-orders.tsx, mobile/src/app/client/orders/[id].tsx, mobile/src/app/client/orders/index.tsx, mobile/src/components/admin/AdminStatusBadge.tsx, mobile/src/components/client/PetCareUI.tsx, mobile/src/components/client/RecordCards.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
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

/** Busca etiqueta por código normalizado y usa fallback para un estado nuevo/desconocido. */
function labelFrom(map: Record<string, string>, value: string, fallback: string): string {
  return map[value.toUpperCase()] ?? fallback;
}

/** Traduce estados de turno a etiquetas en español sin cambiar el código original de la API. */
export const appointmentStatusLabel = (value: string): string => labelFrom(appointmentStatuses, value, 'Estado del turno no disponible');
/** Traduce estados de pedido para la pantalla de seguimiento. */
export const orderStatusLabel = (value: string): string => labelFrom(orderStatuses, value, 'Estado del pedido no disponible');
/** Traduce los estados de reserva que siguen apareciendo en datos/historiales compatibles. */
export const reservationStatusLabel = (value: string): string => labelFrom(reservationStatuses, value, 'Estado de la reserva no disponible');
/** Traduce estados de pago; los códigos se conservan para lógica y persistencia. */
export const paymentStatusLabel = (value: string): string => labelFrom(paymentStatuses, value, 'Estado del pago no disponible');
/** Traduce estados de entrega con fallback legible. */
export const deliveryStatusLabel = (value: string): string => labelFrom(deliveryStatuses, value, 'Estado de entrega no disponible');
/** Traduce estados generales usados por insignias y tarjetas. */
export const generalStatusLabel = (value: string): string => labelFrom(generalStatuses, value, 'Estado no disponible');
/** Presenta el método de pago o comunica que el registro no tiene método asociado. */
export const paymentMethodLabel = (value: string | null): string => value ? paymentMethods[value.toUpperCase()] ?? 'Método de pago no disponible' : 'Sin método';
/** Traduce el tipo de movimiento del historial; usa “Movimiento” si recibe un código desconocido. */
export const historyTypeLabel = (value: string): string => labelFrom(historyTypes, value, 'Movimiento');
/** Elige el mapa de estado correcto según si la fila del historial representa pago, entrega u pedido. */
export const historyStatusLabel = (type: string, value: string | null): string => {
  if (value === null) return '—';
  switch (type.toUpperCase()) {
    case 'PAYMENT': return paymentStatusLabel(value);
    case 'DELIVERY': return deliveryStatusLabel(value);
    default: return orderStatusLabel(value);
  }
};
