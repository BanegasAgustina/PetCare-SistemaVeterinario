/**
 * ARCHIVO: fulfillment.ts
 * UBICACIÓN: mobile/src/utils/fulfillment.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de fulfillment.
 * CONEXIONES: Importa: mobile/src/types/client.ts Se utiliza desde: mobile/src/app/client/(tabs)/store/checkout.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import type { FulfillmentSettings } from '../types/client';

/** Habilita mostrar entrega solo cuando está activa y existe al menos una zona configurada. */
export function hasDeliveryCoverage(settings: Pick<FulfillmentSettings, 'deliveryEnabled' | 'zones'> | null | undefined): boolean {
  return Boolean(settings?.deliveryEnabled && settings.zones.length > 0);
}
