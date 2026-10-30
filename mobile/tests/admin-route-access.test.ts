import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canAccessAdminPath } from '../src/utils/admin-route-access';
import { roleLabel } from '../src/utils/role-label';

const checker = (permissions: string[]) => (code: string) => permissions.includes(code);

test('ADMIN with the role grant to view all patients can open the shared patient list', () => {
  assert.equal(canAccessAdminPath('/admin/patients', checker(['pets.view_all'])), true);
});

test('patient list follows the role grant for all-patient scope', () => {
  assert.equal(canAccessAdminPath('/admin/patients', checker(['pets.view_information'])), false);
  assert.equal(canAccessAdminPath('/admin/patients', checker(['pets.view_all'])), true);
  assert.equal(canAccessAdminPath('/admin/patients', checker([])), false);
});

test('SUPER_ADMIN with effective patient permissions can open patient details', () => {
  assert.equal(canAccessAdminPath('/admin/patient', checker(['pets.view_all'])), true);
});

test('alternate permission routes accept either effective permission', () => {
  assert.equal(canAccessAdminPath('/admin/store-settings', checker(['store.settings.view'])), true);
  assert.equal(canAccessAdminPath('/admin/specialties', checker(['professional_types.manage'])), true);
});

test('web and Android module destinations share the same permission checks', () => {
  const destinations: [string, string][] = [
    ['/admin/agenda', 'appointments.view_all'],
    ['/admin/availability', 'schedule.manage'],
    ['/admin/catalog/services', 'services.manage'],
    ['/admin/catalog/categories', 'categories.manage'],
    ['/admin/catalog/promotions', 'promotions.manage'],
    ['/admin/store-orders', 'orders.view_all'],
    ['/admin/store-banners', 'store.banners.manage'],
    ['/admin/professionals', 'professionals.manage'],
    ['/admin/veterinarians', 'veterinarians.manage'],
    ['/admin/users', 'users.manage'],
    ['/admin/clients', 'users.view_basic'],
    ['/admin/roles', 'roles.manage'],
    ['/admin/permissions', 'permissions.manage'],
    ['/admin/general-information', 'settings.general.manage'],
  ];
  for (const [path, permission] of destinations) {
    assert.equal(canAccessAdminPath(path, checker([permission])), true, `${path} should accept ${permission}`);
    assert.equal(canAccessAdminPath(path, checker([])), false, `${path} should reject missing permission`);
  }
});

test('module routes do not open without their corresponding permission', () => {
  assert.equal(canAccessAdminPath('/admin/agenda', checker(['appointments.view_own'])), false);
  assert.equal(canAccessAdminPath('/admin/catalog/promotions', checker(['categories.manage'])), false);
});

test('known section hubs remain available and unknown admin paths stay closed', () => {
  assert.equal(canAccessAdminPath('/admin/clinic', checker([])), true);
  assert.equal(canAccessAdminPath('/admin/unconfigured', checker([])), false);
});

test('reserved legacy SECRETARY role has a stable label when its stored name is absent or malformed', () => {
  assert.equal(roleLabel('SECRETARY', 'Nombre guardado obsoleto'), 'Secretaría');
  assert.equal(roleLabel('SECRETARY', 'Secretaría'), 'Secretaría');
});
