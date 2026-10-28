// Este archivo se encarga de definir y validar qué cambios de estado permite un pedido de tienda.

// Dato operationalOrderStatuses: conserva un valor calculado o de configuración usado por este módulo.
export const operationalOrderStatuses = ['PLACED', 'CONFIRMED', 'PROCESSING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'PICKED_UP', 'CANCELLED'] as const;

/** UI hint only; update() repeats every permission, payment, and transition check inside its transaction. */
// Función allowedOrderTransitions: concentra la lógica dentro de este módulo.
export function allowedOrderTransitions(orderStatus: string, paymentStatus: string, fulfillmentMethod: string | null, canManageOrders: boolean): string[] {
  if (!canManageOrders) return [];
  return operationalOrderStatuses.filter(next =>
    (next === 'CANCELLED' || paymentStatus === 'PAID') && validOrderTransition(orderStatus, next, fulfillmentMethod),
  );
}

// Función validOrderTransition: concentra la lógica dentro de este módulo.
export function validOrderTransition(old: string, next: string, method: string | null): boolean {
  if (next === 'CANCELLED') return ['PLACED', 'CONFIRMED', 'PROCESSING'].includes(old);
  const pickup: Record<string, string[]> = { PLACED: ['CONFIRMED'], CONFIRMED: ['PROCESSING'], PROCESSING: ['READY'], READY: ['PICKED_UP'] };
  const delivery: Record<string, string[]> = { PLACED: ['CONFIRMED'], CONFIRMED: ['PROCESSING'], PROCESSING: ['IN_TRANSIT'], IN_TRANSIT: ['DELIVERED'] };
  return (method === 'PICKUP' ? pickup : delivery)[old]?.includes(next) ?? false;
}
