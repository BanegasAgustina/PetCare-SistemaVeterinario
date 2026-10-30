import assert from 'node:assert/strict';
import { test } from 'node:test';
import { effectiveRolePermission } from '../src/types/authorization';
import { roleName } from '../src/utils/catalog-presentation';

test('ADMIN and SUPER_ADMIN receive a critical permission only from an effective database grant', () => {
  for (const role of ['ADMIN', 'SUPER_ADMIN']) {
    assert.equal(effectiveRolePermission(role, true, true, null), true);
    assert.equal(effectiveRolePermission(role, true, false, null), false);
    assert.equal(effectiveRolePermission(role, true, true, false), false);
    assert.equal(effectiveRolePermission(role, true, false, true), true);
  }
});

test('a critical user override cannot grant an administrative permission to another role', () => {
  assert.equal(effectiveRolePermission('CLIENT', true, false, true), false);
  assert.equal(effectiveRolePermission('VETERINARIAN', true, true, true), false);
  assert.equal(effectiveRolePermission('GROOMER', false, true, false), false);
});

test('ADMIN and SUPER_ADMIN both retain pets.view_all when the role grant is active', () => {
  assert.equal(effectiveRolePermission('ADMIN', true, true, null), true);
  assert.equal(effectiveRolePermission('SUPER_ADMIN', true, true, null), true);
});

test('reserved legacy SECRETARY role uses its stable display label', () => {
  assert.equal(roleName('SECRETARY', 'Stored legacy name'), 'Secretaría');
});
