import assert from 'node:assert/strict';
import test from 'node:test';
import { readRequiredPhone } from '../src/validators/auth.validator';

test('normaliza celular argentino internacional con espacios', () => {
  assert.equal(readRequiredPhone('+54 9 223 123 4567'), '+5492231234567');
});

test('rechaza teléfonos vacíos, incompletos, con letras, símbolos, ceros o demasiados dígitos', () => {
  for (const value of ['', '+54 9 223', '+54 9 223 ABC 4567', '+54 (9) 223 123 4567', '+000000000000', '+1234567890123456']) {
    assert.throws(() => readRequiredPhone(value), /VALIDATION_ERROR|teléfono|número/i, value);
  }
  assert.throws(() => readRequiredPhone(null), /Ingresá tu número de teléfono/);
});

test('admite y normaliza un número válido de otro país', () => {
  assert.equal(readRequiredPhone('+1 415 555 2671'), '+14155552671');
});
