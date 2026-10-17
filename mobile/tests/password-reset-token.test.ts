import test from 'node:test';
import assert from 'node:assert/strict';
import { isValidPasswordResetToken, normalizePasswordResetToken } from '../src/utils/password-reset-token';

test('mobile reset links accept uppercase tokens and reject invalid values', () => {
  const token = 'A'.repeat(64);
  assert.equal(normalizePasswordResetToken(token), token.toLowerCase());
  assert.equal(isValidPasswordResetToken([token]), true);
  assert.equal(isValidPasswordResetToken('not-a-token'), false);
});
