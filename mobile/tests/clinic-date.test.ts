import assert from 'node:assert/strict';
import test from 'node:test';
import { clinicDate, clinicDateFilterToApi, clinicDateTime, clinicInstant } from '../src/utils/clinic-date';

test('clinicDate keeps the Argentine calendar day for SQL date values', () => {
  assert.equal(clinicDate('2026-10-13'), '13/10/2026');
});

test('clinicDate converts instants to the Buenos Aires calendar day', () => {
  assert.equal(clinicDate('2026-10-14T02:30:00.000Z'), '13/10/2026');
  assert.match(clinicDateTime('2026-10-14T02:30:00.000Z'), /^13\/10\/2026, 23:30$/);
});

test('clinicInstant interprets form values in Argentina and rejects invalid dates', () => {
  assert.equal(clinicInstant('13/10/2026 09:15'), '2026-10-13T12:15:00.000Z');
  assert.equal(clinicInstant('31/02/2026 09:15'), null);
});

test('date filters keep DD/MM/YYYY in the UI and convert valid values for the API', () => {
  assert.equal(clinicDateFilterToApi('13/10/2026'), '2026-10-13');
  assert.equal(clinicDateFilterToApi('31/02/2026'), '31/02/2026');
});
