import assert from 'node:assert/strict';
import test from 'node:test';
import { validateCheckoutAddress, validateCheckoutBuyer } from '../src/utils/checkout-validation';

test('checkout identifies required address fields with specific messages', () => {
  const errors = validateCheckoutAddress({
    recipientName: '', phone: '', street: '', streetNumber: '', unit: '',
    city: '', province: '', postalCode: '', reference: '',
  });

  assert.equal(errors.postalCode, 'Ingresá el código postal.');
  assert.equal(errors.streetNumber, 'Ingresá el número de calle.');
  assert.equal(Object.keys(errors).length, 7);
});

test('checkout accepts buyer details after trimming and DNI punctuation', () => {
  assert.deepEqual(validateCheckoutBuyer({
    name: ' Ana Pérez ',
    email: 'ana@example.com',
    dni: '12.345.678',
  }), {});
});
