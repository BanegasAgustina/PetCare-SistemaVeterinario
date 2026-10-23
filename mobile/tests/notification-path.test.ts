import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notificationPath } from '../src/services/notification-path';

test('abre notificaciones hacia el recurso propio reconocido', () => {
  assert.deepEqual(notificationPath('order', '42'), { pathname: '/client/orders/[id]', params: { id: '42' } });
  assert.deepEqual(notificationPath('reservation', '12'), { pathname: '/client/orders/[id]', params: { id: '12' } });
  assert.deepEqual(notificationPath('appointment', '19'), { pathname: '/client/appointments/[id]', params: { id: '19' } });
  assert.equal(notificationPath('appointment', null), '/client/appointments');
});

test('envía referencias inválidas al centro de notificaciones', () => {
  assert.equal(notificationPath('order', '../other-user'), '/client/notifications');
  assert.equal(notificationPath('unknown', '42'), '/client/notifications');
});
