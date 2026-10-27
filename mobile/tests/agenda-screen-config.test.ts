import assert from 'node:assert/strict';
import test from 'node:test';
import { agendaScreenConfig } from '../src/utils/agenda-screen-config';

test('agenda layout follows effective appointment scope across roles', () => {
  const ownScope = (permission: string) => permission === 'appointments.view_own';
  const veterinarian = agendaScreenConfig('VETERINARIAN', ownScope);
  const secretary = agendaScreenConfig('SECRETARY', ownScope);

  assert.equal(veterinarian.personalAgenda, true);
  assert.equal(secretary.personalAgenda, true);
  assert.equal(veterinarian.canSearchOwner, false);
  assert.equal(secretary.canSearchOwner, false);
  assert.equal(veterinarian.basePath, '/vet');
  assert.equal(secretary.basePath, '/secretary');
});

test('clinic wide appointment access uses the shared management presentation', () => {
  const clinicScope = (permission: string) => ['appointments.view_own', 'appointments.view_all', 'users.view_basic'].includes(permission);
  const vet = agendaScreenConfig('VETERINARIAN', clinicScope);
  const admin = agendaScreenConfig('ADMIN', clinicScope);

  assert.equal(vet.personalAgenda, false);
  assert.equal(admin.personalAgenda, false);
  assert.equal(vet.canSearchOwner, true);
  assert.equal(admin.canSearchOwner, true);
});
