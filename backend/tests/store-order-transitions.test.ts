import assert from 'node:assert/strict';
import test from 'node:test';
import { allowedOrderTransitions, validOrderTransition } from '../src/utils/store-order-transitions';

test('pending pickup order exposes cancellation but cannot be prepared before payment', () => {
  assert.deepEqual(allowedOrderTransitions('PLACED', 'PENDING', 'PICKUP', true), ['CANCELLED']);
});

test('paid orders expose the transition for their configured fulfillment method', () => {
  assert.deepEqual(allowedOrderTransitions('PROCESSING', 'PAID', 'DELIVERY', true), ['IN_TRANSIT', 'CANCELLED']);
  assert.deepEqual(allowedOrderTransitions('PROCESSING', 'PAID', 'PICKUP', true), ['READY', 'CANCELLED']);
});

test('order statuses are not exposed as available actions without the effective grant', () => {
  assert.deepEqual(allowedOrderTransitions('PLACED', 'PAID', 'PICKUP', false), []);
});

test('delivery completion and pickup completion stay distinct', () => {
  assert.deepEqual(allowedOrderTransitions('IN_TRANSIT', 'PAID', 'DELIVERY', true), ['DELIVERED']);
  assert.deepEqual(allowedOrderTransitions('READY', 'PAID', 'PICKUP', true), ['PICKED_UP']);
});

test('terminal orders expose no further actions', () => {
  assert.deepEqual(allowedOrderTransitions('CANCELLED', 'PENDING', 'PICKUP', true), []);
  assert.equal(validOrderTransition('READY', 'CANCELLED', 'PICKUP'), false);
});
