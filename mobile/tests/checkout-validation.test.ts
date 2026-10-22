import assert from 'node:assert/strict';
import test from 'node:test';
import { mapCheckoutFieldErrors, validateCheckoutAddress, validateCheckoutBuyer } from '../src/utils/checkout-validation';

const address = { recipientName: 'Ana Cliente', phone: '1122334455', street: 'Calle Uno', streetNumber: '10', unit: '', city: 'La Plata', province: 'Buenos Aires', postalCode: '1900', reference: '' };

test('checkout address accepts a valid delivery address and optional fields', () => {
  assert.deepEqual(validateCheckoutAddress(address), {});
});

test('checkout address identifies missing required fields and excessive lengths inline', () => {
  const errors = validateCheckoutAddress({ ...address, phone: '', city: 'x'.repeat(101) });
  assert.equal(errors.phone, 'Ingresá el teléfono.');
  assert.equal(errors.city, 'La ciudad admite hasta 100 caracteres.');
});

test('bank transfer buyer accepts valid identity details and explains invalid fields', () => {
  assert.deepEqual(validateCheckoutBuyer({ name: 'Ana Cliente', email: 'ana@example.com', dni: '12.345.678' }), {});
  const errors = validateCheckoutBuyer({ name: 'Ana', email: 'correo-invalido', dni: '12a' });
  assert.equal(errors.buyerName, 'Ingresá nombre y apellido.');
  assert.equal(errors.buyerEmail, 'Ingresá un correo electrónico válido.');
  assert.equal(errors.buyerDni, 'El DNI debe contener entre 7 y 9 números.');
});

test('backend address field paths map to their checkout inputs', () => {
  assert.deepEqual(mapCheckoutFieldErrors([{ field: 'address.postalCode', message: 'Código postal inválido.' }, { field: 'buyerDni', message: 'DNI inválido.' }]), {
    postalCode: 'Código postal inválido.', buyerDni: 'DNI inválido.',
  });
});
