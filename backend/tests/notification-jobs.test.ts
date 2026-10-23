import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'node:test';
import type { Request, Response, RequestHandler } from 'express';
import type { PoolConnection } from 'mysql2/promise';
import { createClientNotification } from '../src/repositories/notification.repository';
import { createNotificationJobsRouter } from '../src/routes/notification-jobs.routes';
import { readMigrationFiles } from '../src/database/migration-files';
import { retryDelaySeconds, runNotificationJobTasks } from '../src/services/notifications.service';
import { AppError } from '../src/utils/app-error';

type RouteLayer = { route?: { path: string; stack: { handle: RequestHandler }[] } };

function cronHandler(processJobs: () => Promise<{
  remindersCreated: number; pushesAccepted: number; receiptsChecked: number; emailsSent: number;
}>) {
  const router = createNotificationJobsRouter(processJobs) as unknown as { stack: RouteLayer[] };
  const route = router.stack.find(layer => layer.route?.path === '/')?.route;
  assert.ok(route, 'cron GET route should be registered');
  return route.stack[0]!.handle;
}

function responseDouble() {
  const result: { statusCode?: number; headers: Record<string, string>; body?: unknown } = { headers: {} };
  const response = {
    setHeader(name: string, value: string) { result.headers[name] = value; return response; },
    status(code: number) { result.statusCode = code; return response; },
    json(body: unknown) { result.body = body; return response; },
  } as unknown as Response;
  return { response, result };
}

test('el cron exige CRON_SECRET y nunca ejecuta tareas sin un Bearer válido', async () => {
  const previous = process.env.CRON_SECRET;
  const secret = 'notification-test-secret-32-bytes'.padEnd(32, 'x');
  let calls = 0;
  const handler = cronHandler(async () => {
    calls += 1;
    return { remindersCreated: 1, pushesAccepted: 2, receiptsChecked: 3, emailsSent: 4 };
  });
  const invoke = async (authorization?: string) => {
    let forwarded: unknown;
    const { response, result } = responseDouble();
    const request = { get: (name: string) => name.toLowerCase() === 'authorization' ? authorization : undefined } as unknown as Request;
    await handler(request, response, error => { forwarded = error; });
    return { forwarded, result };
  };

  try {
    delete process.env.CRON_SECRET;
    const unconfigured = await invoke(`Bearer ${secret}`);
    assert.ok(unconfigured.forwarded instanceof AppError);
    assert.equal((unconfigured.forwarded as AppError).status, 503);

    process.env.CRON_SECRET = secret;
    const unauthorized = await invoke('Bearer wrong-secret');
    assert.ok(unauthorized.forwarded instanceof AppError);
    assert.equal((unauthorized.forwarded as AppError).status, 401);
    assert.equal(calls, 0);

    const authorized = await invoke(`Bearer ${secret}`);
    assert.equal(authorized.forwarded, undefined);
    assert.equal(authorized.result.statusCode, 200);
    assert.equal(authorized.result.headers['Cache-Control'], 'no-store');
    assert.deepEqual(authorized.result.body, { success: true, data: { remindersCreated: 1, pushesAccepted: 2, receiptsChecked: 3, emailsSent: 4 } });
    assert.equal(calls, 1);
  } finally {
    if (previous === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = previous;
  }
});

test('el procesador cron recorre recordatorios, recibos, push y correo en orden', async () => {
  const calls: string[] = [];
  const result = await runNotificationJobTasks({
    createDueAppointmentReminders: async () => { calls.push('reminders'); return 1; },
    checkPushReceipts: async () => { calls.push('receipts'); return 2; },
    claimPushDeliveries: async () => { calls.push('claim-push'); return []; },
    sendPushBatch: async deliveries => { calls.push(`send-push:${deliveries.length}`); return 3; },
    claimEmailDeliveries: async () => { calls.push('claim-email'); return []; },
    sendEmailBatch: async deliveries => { calls.push(`send-email:${deliveries.length}`); return 4; },
  });
  assert.deepEqual(calls, ['reminders', 'receipts', 'claim-push', 'send-push:0', 'claim-email', 'send-email:0']);
  assert.deepEqual(result, { remindersCreated: 1, receiptsChecked: 2, pushesAccepted: 3, emailsSent: 4 });
});

test('la migración versionada refleja el contrato de la cola de correo y evita duplicados', async () => {
  const migrations = await readMigrationFiles(resolve(process.cwd(), 'client-migrations'));
  const names = migrations.map(migration => migration.version);
  assert.ok(names.includes('015_notification_preferences_and_visibility.sql'));
  assert.ok(names.includes('016_notification_email_deliveries.sql'));
  assert.ok(names.indexOf('016_notification_email_deliveries.sql') > names.indexOf('015_notification_preferences_and_visibility.sql'));
  assert.equal(migrations.find(migration => migration.version === '016_notification_email_deliveries.sql')?.statements.length, 1);
  const migration = readFileSync(resolve(process.cwd(), 'client-migrations/016_notification_email_deliveries.sql'), 'utf8');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS client_notification_email_deliveries/i);
  for (const field of ['notification_id BIGINT UNSIGNED NOT NULL', "status ENUM('PENDING','SENDING','SENT','FAILED') NOT NULL DEFAULT 'PENDING'", 'attempts INT UNSIGNED NOT NULL DEFAULT 0', 'next_attempt_at DATETIME(3) NOT NULL', 'lease_expires_at DATETIME(3) NULL', 'last_error_code VARCHAR(64)']) {
    assert.ok(migration.includes(field), `migration should define ${field}`);
  }
  assert.match(migration, /UNIQUE KEY uq_notification_email_delivery \(notification_id\)/i);
  assert.match(migration, /KEY idx_notification_email_pending \(status, next_attempt_at, id\)/i);
  assert.match(migration, /FOREIGN KEY \(notification_id\) REFERENCES client_notifications\(id\) ON DELETE CASCADE/i);
});

test('la idempotencia de evento corta la cola antes de crear otra entrega de correo', async () => {
  const statements: string[] = [];
  const connection = {
    execute: async (sql: string) => {
      statements.push(sql);
      throw Object.assign(new Error('duplicate event key'), { code: 'ER_DUP_ENTRY' });
    },
  } as unknown as PoolConnection;
  const created = await createClientNotification(connection, {
    ownerId: '1', title: 'Aviso', body: 'Contenido', eventType: 'APPOINTMENT_CONFIRMED', eventKey: 'appointment:1:confirmed',
  });
  assert.equal(created, false);
  assert.equal(statements.length, 1);
  assert.match(statements[0]!, /INSERT INTO client_notifications/);
  assert.equal(statements.some(sql => /client_notification_email_deliveries/.test(sql)), false);
});

test('el cron está configurado cada cinco minutos y los reintentos tienen espera exponencial acotada', () => {
  const vercel = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as { crons: { path: string; schedule: string }[] };
  assert.deepEqual(vercel.crons, [{ path: '/api/cron/notifications', schedule: '*/5 * * * *' }]);
  assert.equal(retryDelaySeconds(1), 60);
  assert.equal(retryDelaySeconds(2), 120);
  assert.equal(retryDelaySeconds(8), 1800);
});
