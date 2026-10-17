import test from 'node:test';
import assert from 'node:assert/strict';
import { roleName } from '../src/utils/catalog-presentation';

test('roleName presents SUPER_ADMIN as Administrador principal without changing its code', () => {
  assert.equal(roleName('SUPER_ADMIN', 'Super Admin'), 'Administrador principal');
  assert.equal(roleName('ADMIN', 'Administrador'), 'Administrador');
});
