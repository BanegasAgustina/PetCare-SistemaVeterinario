import test from 'node:test';
import assert from 'node:assert/strict';
import { databasePool } from '../src/config/database';
import { publicFulfillment, publicPromotions, quoteDelivery } from '../src/repositories/storefront.repository';

type QueryHandler = (sql: string) => unknown[];

async function withQueryHandler<T>(handler: QueryHandler, run: () => Promise<T>): Promise<T> {
  const original = Object.getOwnPropertyDescriptor(databasePool, 'execute');
  Object.defineProperty(databasePool, 'execute', {
    configurable: true,
    value: async (sql: string) => [handler(sql), []],
  });
  try {
    return await run();
  } finally {
    if (original) Object.defineProperty(databasePool, 'execute', original);
    else Reflect.deleteProperty(databasePool, 'execute');
  }
}

test('active promotion query returns an empty list when there are no current promotions', async () => {
  const promotions = await withQueryHandler(sql => {
    assert.match(sql, /pr\.is_active=1/);
    assert.match(sql, /pr\.starts_at<=UTC_TIMESTAMP\(\)/);
    assert.match(sql, /pr\.ends_at>UTC_TIMESTAMP\(\)/);
    return [];
  }, publicPromotions);
  assert.deepEqual(promotions, []);
});

test('promotion banner uses the active promotion price and product image', async () => {
  const product = {
    id: '9', name: 'Producto real', description: 'Descripción', imageUrl: 'https://images.example/product.png',
    categoryId: '2', category: 'Accesorios', stock: 4, physicalStock: 4, reservedStock: 0,
    requiresPrescription: false, speciesId: null, productType: 'ACCESSORY', isActive: true,
    regularPriceCents: 10000, priceCents: 7500,
  };
  const banners = await withQueryHandler(sql => {
    if (/\n\s+FROM client_products p LEFT JOIN/.test(sql)) return [product];
    if (sql.includes('FROM client_promotions pr')) return [{
      id: '3', promotionName: 'Promoción vigente', productId: '9', bannerImageUrl: null,
      bannerSubtitle: 'Texto configurado', bannerCtaText: 'Ver producto',
    }];
    assert.fail(`Consulta inesperada: ${sql}`);
  }, publicPromotions);
  assert.equal(banners.length, 1);
  assert.equal(banners[0]?.priceCents, 7500);
  assert.equal(banners[0]?.regularPriceCents, 10000);
  assert.equal(banners[0]?.imageUrl, product.imageUrl);
  assert.equal(banners[0]?.promotionName, 'Promoción vigente');
});

test('missing commercial settings resolve to both delivery methods disabled', async () => {
  const settings = await withQueryHandler(() => [], publicFulfillment);
  assert.equal(settings.pickupEnabled, false);
  assert.equal(settings.deliveryEnabled, false);
  assert.equal(settings.deliveryBaseFeeCents, 0);
  assert.deepEqual(settings.zones, []);
});

test('configured pickup and delivery settings are returned with active coverage zones', async () => {
  const result = await withQueryHandler(sql => {
    if (sql.includes('FROM client_store_fulfillment_settings')) return [{
      pickupEnabled: 1, pickupAddress: 'Dirección configurada', pickupHours: 'Horario configurado',
      pickupInstructions: 'Indicaciones configuradas', deliveryEnabled: 1, deliveryBaseFeeCents: 1200,
      freeDeliveryThresholdCents: 25000, deliveryHours: 'Horario de envío', deliveryDays: 'Lunes a viernes',
      deliveryInformation: 'Información de envío',
    }];
    if (sql.includes('FROM client_store_delivery_zones')) return [{
      id: '7', name: 'Zona cargada', province: 'Buenos Aires', city: 'La Plata',
      postalCodePrefix: '1900', feeCents: 1500, isActive: 1,
    }];
    assert.fail(`Consulta inesperada: ${sql}`);
  }, publicFulfillment);
  assert.equal(result.pickupEnabled, true);
  assert.equal(result.deliveryEnabled, true);
  assert.equal(result.pickupAddress, 'Dirección configurada');
  assert.equal(result.deliveryBaseFeeCents, 1200);
  assert.equal(result.zones[0]?.feeCents, 1500);
  assert.equal(result.zones[0]?.postalCodePrefix, '1900');
});

test('pickup can remain enabled while delivery is explicitly disabled', async () => {
  const result = await withQueryHandler(sql => sql.includes('FROM client_store_fulfillment_settings')
    ? [{ pickupEnabled: 1, pickupAddress: 'Local configurado', deliveryEnabled: 0, deliveryBaseFeeCents: 0, freeDeliveryThresholdCents: null }]
    : [], publicFulfillment);
  assert.equal(result.pickupEnabled, true);
  assert.equal(result.pickupAddress, 'Local configurado');
  assert.equal(result.deliveryEnabled, false);
});

test('an explicitly disabled configuration keeps both fulfillment options unavailable', async () => {
  const result = await withQueryHandler(sql => sql.includes('FROM client_store_fulfillment_settings')
    ? [{ pickupEnabled: 0, pickupAddress: null, deliveryEnabled: 0, deliveryBaseFeeCents: 0, freeDeliveryThresholdCents: null }]
    : [], publicFulfillment);
  assert.equal(result.pickupEnabled, false);
  assert.equal(result.deliveryEnabled, false);
});

test('delivery quote is unavailable when delivery is disabled', async () => {
  const result = await withQueryHandler(sql => sql.includes('FROM client_store_fulfillment_settings')
    ? [{ deliveryEnabled: 0, deliveryBaseFeeCents: 0, freeDeliveryThresholdCents: null }]
    : [], () => quoteDelivery({ province: 'Buenos Aires', city: 'La Plata', postalCode: '1900', subtotalCents: '5000' }));
  assert.deepEqual(result, { available: false, feeCents: 0, reason: 'delivery_disabled', zoneName: null });
});

test('delivery quote uses the configured zone price and coverage', async () => {
  const result = await withQueryHandler(sql => sql.includes('FROM client_store_fulfillment_settings')
    ? [{ deliveryEnabled: 1, deliveryBaseFeeCents: 1200, freeDeliveryThresholdCents: null }]
    : [{ id: '7', name: 'Zona cargada', province: 'Buenos Aires', city: 'La Plata', postalCodePrefix: '1900', feeCents: 1500, isActive: 1 }],
  () => quoteDelivery({ province: 'Buenos Aires', city: 'La Plata', postalCode: '1900123', subtotalCents: '5000' }));
  assert.deepEqual(result, { available: true, feeCents: 1500, reason: null, zoneName: 'Zona cargada' });
});
