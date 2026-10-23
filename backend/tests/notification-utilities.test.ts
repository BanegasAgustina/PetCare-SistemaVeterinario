import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isValidExpoPushToken } from '../src/utils/expo-push-token';
import { formatNotificationDateTime } from '../src/utils/notification-date';
import { assertTransition } from '../src/utils/clinic-rules';

test('acepta Expo Push Tokens y rechaza valores arbitrarios', () => {
  assert.equal(isValidExpoPushToken('ExpoPushToken[abcdef0123456789]'), true);
  assert.equal(isValidExpoPushToken('ExponentPushToken[abc.DEF_123]'), true);
  assert.equal(isValidExpoPushToken('token-de-prueba'), false);
  assert.equal(isValidExpoPushToken('ExpoPushToken[]'), false);
  assert.equal(isValidExpoPushToken(`ExpoPushToken[${'a'.repeat(250)}]`), false);
});

test('formatea fecha de avisos en la zona de Buenos Aires', () => {
  assert.deepEqual(formatNotificationDateTime('2026-10-25 18:00:00'), { date: '25/10/2026', time: '15:00' });
  assert.throws(() => formatNotificationDateTime('not-a-date'));
});

test('una solicitud de turno puede rechazarse y el turno rechazado queda cerrado', () => {
  assert.doesNotThrow(() => assertTransition('REQUESTED', 'REJECTED', 'appointment'));
  assert.throws(() => assertTransition('REJECTED', 'CONFIRMED', 'appointment'));
});
