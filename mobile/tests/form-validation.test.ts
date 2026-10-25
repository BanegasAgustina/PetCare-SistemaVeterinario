import assert from 'node:assert/strict';
import test from 'node:test';
import { firstInvalidField } from '../src/utils/auth-validation';

test('firstInvalidField returns the earliest invalid field in visual order', () => {
  assert.equal(firstInvalidField(['firstName', 'lastName', 'phone'] as const, {
    lastName: 'Ingresá tu apellido.',
    phone: 'Ingresá un teléfono válido.',
  }), 'lastName');
});

test('firstInvalidField returns undefined when there are no field errors', () => {
  assert.equal(firstInvalidField(['currentPassword', 'password'] as const, {}), undefined);
});
