import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePasswordResetToken } from '../src/utils/password-reset-token';

test('password reset tokens are normalized to lowercase before validation', () => {
  const token = 'A'.repeat(64);
  assert.equal(normalizePasswordResetToken(token), token.toLowerCase());
  assert.throws(() => normalizePasswordResetToken('not-a-token'), /El enlace no es válido o venció\./);
});
