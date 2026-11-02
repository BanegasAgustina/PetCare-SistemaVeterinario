/**
 * ARCHIVO: store-order-transitions.ts
 * UBICACIÓN: backend/src/utils/store-order-transitions.ts
 * FUNCIÓN: Calcula transiciones operativas de pedidos de tienda.
 * RESPONSABILIDAD: Determinar estados siguientes según pago, entrega y capacidad del actor.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/store-orders.repository.ts
 * FUNCIONAMIENTO: Usa listas de estados operativos, reglas de transición y método de retiro/envío.
 * IMPORTANCIA: Evita transiciones de pedido incompatibles con pago o fulfillment.
 */
// Este archivo se encarga de definir y validar qué cambios de estado permite un pedido de tienda.

// Estados de pedido que puede mostrar y procesar la operación de tienda.
export const operationalOrderStatuses = ['PLACED', 'CONFIRMED', 'PROCESSING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'PICKED_UP', 'CANCELLED'] as const;

/** UI hint only; update() repeats every permission, payment, and transition check inside its transaction. */
/** Deriva estados siguientes de pedido según pago, fulfillment y capacidad del actor. */
export function allowedOrderTransitions(orderStatus: string, paymentStatus: string, fulfillmentMethod: string | null, canManageOrders: boolean): string[] {
  if (!canManageOrders) return [];
  return operationalOrderStatuses.filter(next =>
    (next === 'CANCELLED' || paymentStatus === 'PAID') && validOrderTransition(orderStatus, next, fulfillmentMethod),
  );
}

/** Verifica si cambio de estado es válido para el método de entrega actual. */
export function validOrderTransition(old: string, next: string, method: string | null): boolean {
  if (next === 'CANCELLED') return ['PLACED', 'CONFIRMED', 'PROCESSING'].includes(old);
  const pickup: Record<string, string[]> = { PLACED: ['CONFIRMED'], CONFIRMED: ['PROCESSING'], PROCESSING: ['READY'], READY: ['PICKED_UP'] };
  const delivery: Record<string, string[]> = { PLACED: ['CONFIRMED'], CONFIRMED: ['PROCESSING'], PROCESSING: ['IN_TRANSIT'], IN_TRANSIT: ['DELIVERED'] };
  return (method === 'PICKUP' ? pickup : delivery)[old]?.includes(next) ?? false;
}
