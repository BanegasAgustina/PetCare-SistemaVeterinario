import assert from 'node:assert/strict';
import test from 'node:test';
import { notificationPath } from '../src/services/notification-path';

test('opening an internal notification routes only supported, well-formed client references', () => {
  assert.deepEqual(notificationPath('appointment', '18'), { pathname: '/client/appointments/[id]', params: { id: '18' } });
  assert.deepEqual(notificationPath('order', '42'), { pathname: '/client/orders/[id]', params: { id: '42' } });
  assert.deepEqual(notificationPath('pet', '7'), { pathname: '/client/pets/[id]', params: { id: '7' } });
});

test('unknown or malformed internal notification references use a safe fallback', () => {
  assert.equal(notificationPath('appointment', null), '/client/appointments');
  assert.equal(notificationPath('arbitrary-route', '7'), '/client/notifications');
  assert.equal(notificationPath('order', '../admin'), '/client/notifications');
});
