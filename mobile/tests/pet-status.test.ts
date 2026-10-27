import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePetActiveFlag, petStatusBadge } from '../src/utils/pet-status';

test('pet active flag normalizes API booleans, tinyints, and strings without truthiness coercion', () => {
  for (const value of [true, 1, '1', 'true', 'ACTIVE', ' activo ']) assert.equal(normalizePetActiveFlag(value), true);
  for (const value of [false, 0, '0', 'false', 'INACTIVE', ' inactivo ']) assert.equal(normalizePetActiveFlag(value), false);
});

test('null and unknown pet active values remain unknown instead of becoming inactive or active', () => {
  for (const value of [null, undefined, '', 'null', 'pending', 2]) assert.equal(normalizePetActiveFlag(value), null);
  assert.equal(petStatusBadge('0'), 'INACTIVE');
  assert.equal(petStatusBadge('1'), 'ACTIVE');
  assert.equal(petStatusBadge(null), 'UNKNOWN');
});
