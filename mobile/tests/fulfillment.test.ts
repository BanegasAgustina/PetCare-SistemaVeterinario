import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasDeliveryCoverage } from '../src/utils/fulfillment';

test('delivery is unavailable when the API has no configured zones', () => {
  assert.equal(hasDeliveryCoverage({ deliveryEnabled: true, zones: [] }), false);
  assert.equal(hasDeliveryCoverage({ deliveryEnabled: false, zones: [{ id: '1', name: 'Centro', province: 'Buenos Aires', city: 'La Plata', postalCodePrefix: null, feeCents: 100, isActive: true }] }), false);
});

test('delivery remains available when enabled and the API returns an active coverage zone', () => {
  assert.equal(hasDeliveryCoverage({ deliveryEnabled: true, zones: [{ id: '1', name: 'Centro', province: 'Buenos Aires', city: 'La Plata', postalCodePrefix: null, feeCents: 100, isActive: true }] }), true);
  assert.equal(hasDeliveryCoverage(undefined), false);
});
