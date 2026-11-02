import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePhoneNumber } from '../src/utils/auth-validation';

test('normaliza celular argentino internacional con espacios', () => {
  assert.deepEqual(normalizePhoneNumber('+54 9 223 123 4567'), { phone: '+5492231234567' });
});

test('rechaza teléfono vacío, incompleto, con letras, símbolos, ceros o demasiados dígitos', () => {
  for (const value of ['', '+54 9 223', '+54 9 223 ABC 4567', '+54 (9) 223 123 4567', '+000000000000', '+1234567890123456']) {
    assert.equal(Boolean(normalizePhoneNumber(value).error), true, value);
  }
});

test('permite un número internacional válido y devuelve E.164', () => {
  assert.deepEqual(normalizePhoneNumber('+1 415 555 2671'), { phone: '+14155552671' });
});
