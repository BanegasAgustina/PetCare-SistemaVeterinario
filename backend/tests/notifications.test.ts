import test from 'node:test';
import assert from 'node:assert/strict';
import type { PoolConnection } from 'mysql2/promise';
import { createClientNotification } from '../src/repositories/notification.repository';
import { appointmentReminderEventKey, appointmentReminderWindow } from '../src/services/notifications.service';
import { isValidExpoPushToken } from '../src/utils/expo-push-token';
import { formatNotificationDateTime } from '../src/utils/notification-date';
import { isCronAuthorized } from '../src/utils/cron-auth';

test('appointment notification date uses Argentina local time from UTC database values', () => {
  assert.deepEqual(formatNotificationDateTime('2026-10-18 18:00:00'), {
    date: '18/10/2026',
    time: '15:00',
  });
});

test('scheduled notification endpoint requires a long bearer secret', () => {
  const secret = 'a'.repeat(64);
  assert.equal(isCronAuthorized(`Bearer ${secret}`, secret), true);
  assert.equal(isCronAuthorized(`Bearer ${'b'.repeat(64)}`, secret), false);
  assert.equal(isCronAuthorized(secret, secret), false);
  assert.equal(isCronAuthorized(`Bearer ${'a'.repeat(31)}`, 'a'.repeat(31)), false);
});

test('24-hour and 4-hour reminders use bounded catch-up windows and slot-specific idempotency keys', () => {
  assert.deepEqual(appointmentReminderWindow(24), { lowerOffsetMinutes: 1430, upperOffsetMinutes: 1445 });
  assert.deepEqual(appointmentReminderWindow(4), { lowerOffsetMinutes: 230, upperOffsetMinutes: 245 });
  assert.equal(appointmentReminderEventKey('8', '12', 24), 'appointment:8:slot:12:reminder:24h');
  assert.notEqual(appointmentReminderEventKey('8', '12', 24), appointmentReminderEventKey('8', '13', 24));
  assert.notEqual(appointmentReminderEventKey('8', '12', 24), appointmentReminderEventKey('8', '12', 4));
});

test('push token validation accepts Expo formats and rejects malformed or oversized input', () => {
  assert.equal(isValidExpoPushToken('ExpoPushToken[abcdef_0123-XYZ]'), true);
  assert.equal(isValidExpoPushToken('ExponentPushToken[abcdef0123]'), true);
  assert.equal(isValidExpoPushToken('ExponentPushToken[broken'), false);
  assert.equal(isValidExpoPushToken(`ExpoPushToken[${'x'.repeat(256)}]`), false);
  assert.equal(isValidExpoPushToken(''), false);
});

test('notification persistence queues one push delivery per unique event key', async () => {
  const statements: string[] = [];
  let inserted = false;
  const connection = {
    execute: async (sql: string, values?: unknown[]) => {
      statements.push(sql);
      if (sql.startsWith('INSERT INTO client_notifications')) {
        assert.deepEqual(values?.slice(0, 4), ['42', 'Recordatorio', 'Turno mañana', 'APPOINTMENT_REMINDER_24H']);
        if (inserted) {
          const duplicate = Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
          throw duplicate;
        }
        inserted = true;
        return [{ affectedRows: 1 }, []];
      }
      if (sql.includes('LAST_INSERT_ID')) return [[{ id: '99' }], []];
      if (sql.includes('client_notification_push_deliveries')) return [{ affectedRows: 2 }, []];
      throw new Error('Unexpected database statement in test.');
    },
  } as unknown as PoolConnection;

  const notification = {
    ownerId: '42',
    title: 'Recordatorio',
    body: 'Turno mañana',
    eventType: 'APPOINTMENT_REMINDER_24H',
    eventKey: 'appointment:8:slot:12:reminder:24h',
    referenceType: 'appointment',
    referenceId: '8',
  };
  assert.equal(await createClientNotification(connection, notification), true);
  assert.equal(await createClientNotification(connection, notification), false);
  assert.equal(statements.filter(sql => sql.includes('client_notification_push_deliveries')).length, 1);
});
