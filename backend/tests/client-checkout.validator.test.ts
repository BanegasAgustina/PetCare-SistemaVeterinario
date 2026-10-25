import assert from 'node:assert/strict';
import test from 'node:test';
import { storeCheckoutInput, storeTransferInput } from '../src/validators/store-checkout.validator';
import { AppError } from '../src/utils/app-error';

const requestKey = '123e4567-e89b-42d3-a456-426614174000';

test('checkout accepts a demo pickup without address', () => {
  assert.deepEqual(storeCheckoutInput({
    requestKey,
    paymentMethod: 'CARD_DEMO',
    fulfillmentMethod: 'PICKUP',
  }), {
    key: requestKey,
    paymentMethod: 'CARD_DEMO',
    paymentReference: '',
    fulfillmentMethod: 'PICKUP',
    address: null,
  });
});

test('checkout rejects a payment reference for demo card flow', () => {
  assert.throws(
    () => storeCheckoutInput({
      requestKey,
      paymentMethod: 'CARD_DEMO',
      paymentReference: 'not-a-real-payment',
      fulfillmentMethod: 'PICKUP',
    }),
    (error: unknown) => error instanceof AppError && error.code === 'VALIDATION_ERROR',
  );
});

test('delivery checkout reports the missing address field', () => {
  assert.throws(
    () => storeCheckoutInput({
      requestKey,
      paymentMethod: 'BANK_TRANSFER',
      fulfillmentMethod: 'DELIVERY',
    }),
    (error: unknown) => error instanceof AppError && error.fieldErrors?.[0]?.field === 'address',
  );
});

test('bank transfer validates buyer details and normalizes the email', () => {
  const result = storeTransferInput({
    requestKey,
    fulfillmentMethod: 'PICKUP',
    buyerName: '  Ana Pérez  ',
    buyerEmail: ' ANA@EXAMPLE.COM ',
    buyerDni: '12.345.678',
  });

  assert.deepEqual(result.buyer, { name: 'Ana Pérez', email: 'ana@example.com' });
  assert.equal('dni' in result.buyer, false);
});
