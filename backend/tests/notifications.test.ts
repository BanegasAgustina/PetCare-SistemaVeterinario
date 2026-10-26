import assert from 'node:assert/strict';
import test from 'node:test';
import { appointmentReminderEventKey, appointmentReminderWindow, runNotificationJobTasks } from '../src/services/notifications.service';

test('appointment reminder windows are bounded and leave room for the scheduled worker', () => {
  assert.deepEqual(appointmentReminderWindow(24), { lowerOffsetMinutes: 1430, upperOffsetMinutes: 1445 });
  assert.deepEqual(appointmentReminderWindow(4), { lowerOffsetMinutes: 230, upperOffsetMinutes: 245 });
});

test('reminder event keys are stable per appointment, slot, and reminder interval', () => {
  assert.equal(appointmentReminderEventKey('12', '8', 24), 'appointment:12:slot:8:reminder:24h');
  assert.notEqual(appointmentReminderEventKey('12', '8', 24), appointmentReminderEventKey('12', '8', 4));
});

test('serverless notification job creates in-app reminders and processes email only', async () => {
  const calls: string[] = [];
  const result = await runNotificationJobTasks({
    createDueAppointmentReminders: async () => { calls.push('reminders'); return 2; },
    claimEmailDeliveries: async () => { calls.push('claim-email'); return [] as never[]; },
    sendEmailBatch: async () => { calls.push('send-email'); return 5; },
  });
  assert.deepEqual(calls, ['reminders', 'claim-email', 'send-email']);
  assert.deepEqual(result, { remindersCreated: 2, emailsSent: 5 });
});
