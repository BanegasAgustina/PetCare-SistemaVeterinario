import assert from 'node:assert/strict';
import test from 'node:test';
import {DEMO_CARD_NUMBER,validateDemoCard} from '../src/utils/demo-card';

test('accepts only the documented fictitious card and a current expiration',()=>{
  assert.deepEqual(validateDemoCard({holder:'Cliente Demo',number:'4242 4242 4242 4242',expiry:'12/30',cvv:'123'},new Date('2026-10-01T00:00:00Z')),{});
  assert.equal(DEMO_CARD_NUMBER,'4242424242424242');
});

test('rejects any non-test number and expired dates',()=>{
  const errors=validateDemoCard({holder:'Cliente Demo',number:'4111 1111 1111 1111',expiry:'08/26',cvv:'123'},new Date('2026-10-01T00:00:00Z'));
  assert.ok(errors.number);
  assert.ok(errors.expiry);
});
