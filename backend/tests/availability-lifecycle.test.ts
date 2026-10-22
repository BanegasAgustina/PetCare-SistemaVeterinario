import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { availabilityReactivationError } from '../src/utils/availability-lifecycle';
import { assertAdminPermission } from '../src/utils/admin-authorization';

const now = new Date('2030-01-01T00:00:00.000Z');
const slot = { kind: 'slot' as const, startsAt: '2030-01-02 10:00:00', professionalActive: true, serviceActive: true };

describe('availability reactivation rules', () => {
  it('allows a future slot when the professional and service are active and no conflicts exist', () => {
    assert.equal(availabilityReactivationError(slot, now), null);
  });

  it('rejects a slot overlapping an active slot or block', () => {
    assert.match(availabilityReactivationError({ ...slot, hasOverlappingActiveSlot: true }, now) ?? '', /superpone/);
    assert.match(availabilityReactivationError({ ...slot, hasOverlappingActiveBlock: true }, now) ?? '', /bloqueo/);
  });

  it('rejects an inactive professional or service', () => {
    assert.match(availabilityReactivationError({ ...slot, professionalActive: false }, now) ?? '', /profesional está inactivo/);
    assert.match(availabilityReactivationError({ ...slot, serviceActive: false }, now) ?? '', /servicio está inactivo/);
  });

  it('rejects past slots and slots with an existing appointment', () => {
    assert.match(availabilityReactivationError({ ...slot, startsAt: '2029-12-31 23:59:59' }, now) ?? '', /ya comenzó/);
    assert.match(availabilityReactivationError({ ...slot, hasNonCancelledAppointment: true }, now) ?? '', /turno histórico o vigente/);
  });

  it('rejects reactivating a block over another block or a live appointment', () => {
    const block = { kind: 'block' as const, startsAt: '2030-01-02 10:00:00', professionalActive: true };
    assert.match(availabilityReactivationError({ ...block, hasOverlappingActiveBlock: true }, now) ?? '', /bloqueo activo/);
    assert.match(availabilityReactivationError({ ...block, hasNonCancelledAppointment: true }, now) ?? '', /turno vigente/);
  });

  it('requires the existing schedule permission for lifecycle changes', () => {
    assert.throws(() => assertAdminPermission({ id: '2', role: 'ADMIN', permissions: [] } as never, 'schedule.manage'), { status: 403 });
  });
});
