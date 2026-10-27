import assert from 'node:assert/strict';
import test from 'node:test';
import { assertCanManagePetLifecycle, assertNoFuturePatientAppointments, assertPetLifecycleTransition, normalizePetActiveFlag, petDeactivationNotification, petReactivationNotification, requirePetActiveFlag, requiredPetDeactivationReason } from '../src/utils/pet-lifecycle';

test('patient lifecycle requires an effective grant for an explicitly supported role',()=>{
  for(const role of ['ADMIN','SUPER_ADMIN','VETERINARIAN','GROOMER'])
    assert.doesNotThrow(()=>assertCanManagePetLifecycle({role,permissions:['pets.update']}));
  for(const actor of [
    {role:'ADMIN',permissions:[]},
    {role:'VETERINARIAN',permissions:['pets.view_information']},
    {role:'GROOMER',permissions:['appointments.view_own']},
    {role:'SECRETARY',permissions:['pets.update']},
    {role:'CLIENT',permissions:['pets.update']},
  ]) assert.throws(()=>assertCanManagePetLifecycle(actor),{code:'FORBIDDEN'});
});

test('deactivation reason is mandatory, trimmed, and bounded',()=>{
  assert.equal(requiredPetDeactivationReason('  Actualizar documentación  '),'Actualizar documentación');
  for(const value of ['', '  ', 'ok', 'x'.repeat(501), undefined, null, 4])
    assert.throws(()=>requiredPetDeactivationReason(value),{code:'VALIDATION_ERROR'});
});

test('lifecycle transitions reject duplicate operations and allow reactivation',()=>{
  assert.doesNotThrow(()=>assertPetLifecycleTransition(true,false));
  assert.doesNotThrow(()=>assertPetLifecycleTransition(false,true));
  assert.throws(()=>assertPetLifecycleTransition(true,true),{code:'INVALID_TRANSITION'});
  assert.throws(()=>assertPetLifecycleTransition(false,false),{code:'INVALID_TRANSITION'});
});

test('pet active state parses database/API scalar representations strictly',()=>{
  for(const value of [true,1,1n,'1','true',' ACTIVE '])assert.equal(normalizePetActiveFlag(value),true);
  for(const value of [false,0,0n,'0','false',' INACTIVE '])assert.equal(normalizePetActiveFlag(value),false);
  for(const value of [null,undefined,'','unknown',2,Buffer.from([0,1])])assert.equal(normalizePetActiveFlag(value),null);
  assert.throws(()=>requirePetActiveFlag(null),{code:'INVALID_PET_STATE'});
});

test('appointment states never determine the persistent pet active flag',()=>{
  const isActive=requirePetActiveFlag('1');
  for(const appointmentStatus of ['REQUESTED','CONFIRMED','COMPLETED','CANCELLED']){
    assert.equal(isActive,true,`appointment ${appointmentStatus} must not change pet state`);
  }
  assert.doesNotThrow(()=>assertNoFuturePatientAppointments([]));
});

test('future requested, confirmed, and in-progress appointments block deactivation only',()=>{
  for(const status of ['REQUESTED','CONFIRMED','IN_PROGRESS'])
    assert.throws(()=>assertNoFuturePatientAppointments([status]),{code:'PET_HAS_APPOINTMENTS'});
});

test('owner-facing notices identify the pet, reason, and transition time',()=>{
  const notice=petDeactivationNotification('Gala','Actualizar documentación','27/10/2026','10:25');
  assert.match(notice,/Gala/);
  assert.match(notice,/Actualizar documentación/);
  assert.match(notice,/27\/10\/2026 a las 10:25/);
  assert.match(petReactivationNotification('Gala','27/10/2026','10:26'),/Gala.*27\/10\/2026 a las 10:26/);
});
