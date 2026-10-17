import test from 'node:test';
import assert from 'node:assert/strict';
import { notificationPath } from '../src/services/notification-path';

test('notification links only route to the related client-owned screen', () => {
  assert.deepEqual(notificationPath('reservation', '23'), { pathname: '/client/orders/[id]', params: { id: '23' } });
  assert.deepEqual(notificationPath('pet', '7'), { pathname: '/client/pets/[id]', params: { id: '7' } });
  assert.equal(notificationPath('appointment', '5'), '/client/appointments');
  assert.equal(notificationPath('reservation', '/admin'), '/client/notifications');
});
