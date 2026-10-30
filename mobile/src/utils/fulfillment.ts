import type { FulfillmentSettings } from '../types/client';

export function hasDeliveryCoverage(settings: Pick<FulfillmentSettings, 'deliveryEnabled' | 'zones'> | null | undefined): boolean {
  return Boolean(settings?.deliveryEnabled && settings.zones.length > 0);
}
