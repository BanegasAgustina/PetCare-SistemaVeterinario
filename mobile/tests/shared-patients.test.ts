import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { patientScreenConfig } from '../src/utils/patient-screen-config';

const sharedPatientsImport = "export { PatientsScreen as default } from '../../components/clinic/PatientsScreen';";

test('administration and professional patient routes are thin entries to the shared screen', () => {
  for (const route of ['admin', 'vet', 'professional']) {
    const source = readFileSync(new URL(`../src/app/${route}/patients.tsx`, import.meta.url), 'utf8');
    assert.ok(source.includes(sharedPatientsImport), `${route} must render the shared PatientsScreen`);
    assert.equal(source.includes('<PetCareScreen'), false, `${route} must not define a duplicate screen`);
  }
});

test('admin and veterinarian share species filtering while grooming remains scoped to its own workflow', () => {
  const noPermissions = () => false;
  assert.equal(patientScreenConfig('ADMIN', noPermissions).canFilterSpecies, true);
  assert.equal(patientScreenConfig('SUPER_ADMIN', noPermissions).canFilterSpecies, true);
  assert.equal(patientScreenConfig('VETERINARIAN', noPermissions).canFilterSpecies, true);
  assert.equal(patientScreenConfig('GROOMER', noPermissions).canFilterSpecies, false);
});

test('patient edit actions remain limited to roles with the effective permission and supported API operation', () => {
  const granted = (permission: string) => permission === 'pets.update';
  assert.equal(patientScreenConfig('ADMIN', granted).canEditPatient, true);
  assert.equal(patientScreenConfig('VETERINARIAN', granted).canEditPatient, true);
  assert.equal(patientScreenConfig('ADMIN', () => false).canEditPatient, false);
  assert.equal(patientScreenConfig('GROOMER', granted).canEditPatient, false);
  assert.equal(patientScreenConfig('SECRETARY', granted).canEditPatient, false);
});

test('patient lifecycle controls require pets.update for the supported roles and stay hidden for others',()=>{
  const granted=(permission:string)=>permission==='pets.update'||permission==='appointments.view_own';
  for(const role of ['ADMIN','SUPER_ADMIN','VETERINARIAN','GROOMER'])
    assert.equal(patientScreenConfig(role,granted).canManagePatientLifecycle,true,role);
  for(const role of ['ADMIN','SUPER_ADMIN','VETERINARIAN','GROOMER','SECRETARY','CLIENT'])
    assert.equal(patientScreenConfig(role,()=>false).canManagePatientLifecycle,false,role);
  assert.equal(patientScreenConfig('SECRETARY',granted).canManagePatientLifecycle,false);
  assert.equal(patientScreenConfig('GROOMER',permission=>permission==='pets.update').canManagePatientLifecycle,false);
});
