import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const route = (path: string) => new URL(`../src/app/${path}`, import.meta.url);

test('legacy commercial reservation screens are no longer routable', () => {
  for (const path of [
    'admin/reservation.tsx', 'admin/reservations.tsx',
    'secretary/reservation.tsx', 'secretary/reservations.tsx',
    'client/reservation.tsx',
  ]) assert.equal(existsSync(route(path)), false, `${path} must stay retired`);
  assert.equal(existsSync(new URL('../src/components/clinic/ReservationsScreen.tsx', import.meta.url)), false);
});

test('store, order, and clinical appointment routes remain available', () => {
  for (const path of [
    'client/(tabs)/store/index.tsx', 'client/(tabs)/store/cart.tsx',
    'client/(tabs)/store/checkout.tsx', 'client/orders/index.tsx',
    'client/orders/[id].tsx', 'admin/store-orders.tsx',
    'client/(tabs)/appointments.tsx', 'client/appointments/request.tsx',
    'admin/agenda.tsx', 'professional/agenda.tsx', 'vet/agenda.tsx',
  ]) assert.equal(existsSync(route(path)), true, `${path} must remain available`);
});

test('no active mobile service exposes the retired reservation API', () => {
  const source = readFileSync(new URL('../src/services/clinic.service.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /reservations|createReservation|updateReservation/i);
  const breadcrumbs = readFileSync(new URL('../src/components/layout/AppBreadcrumbs.tsx', import.meta.url), 'utf8');
  assert.doesNotMatch(breadcrumbs, /admin\/reservations|secretary\/reservations|client\/reservation/);
});
