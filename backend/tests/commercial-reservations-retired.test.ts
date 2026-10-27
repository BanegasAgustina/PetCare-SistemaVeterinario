import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

test('clinic API no longer mounts commercial reservation endpoints and keeps appointments and orders', () => {
  const routes = source('src/routes/clinic.routes.ts');
  assert.doesNotMatch(routes, /\/reservations/);
  assert.match(routes, /\/appointments/);
  assert.match(routes, /\/grooming\/appointments/);
  assert.match(routes, /\/store-orders/);
});

test('clinic dispatcher and admin permission catalog do not expose the retired module', () => {
  assert.doesNotMatch(source('src/services/clinic.service.ts'), /reservationRepository|case ['"]reservations/);
  assert.doesNotMatch(source('src/repositories/admin.repository.ts'), /reservations\.view_all|reservations\.manage/);
  assert.doesNotMatch(source('src/database/product-origin-migrate.ts'), /reservations\.(view_all|manage)/);
});

test('historical expiry cleanup remains isolated and cannot create or list reservations', () => {
  const legacy = source('src/repositories/reservation.repository.ts');
  assert.match(legacy, /expireDueReservations/);
  assert.doesNotMatch(legacy, /export async function (create|list|get|update|approve|reject)/i);
  assert.match(legacy, /order_type='RESERVATION'/);
});
