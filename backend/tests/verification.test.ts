/** Reglas del código y máscara: las pruebas no requieren DB ni SMTP de producción. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import { maskEmail } from '../src/utils/mask-email';
import { validateVerification } from '../src/validators/verification.validator';
import { hashVerificationCode, hashVerificationToken } from '../src/services/verification.service';
test('email enmascarado sin modificar el destinatario', () => {
  assert.equal(maskEmail('agustin@example.com'), 'ag***@example.com');
  assert.equal(maskEmail('a@example.com'), 'a***@example.com');
  assert.equal(maskEmail('invalid'), '***');
});
test('código estricto y hash con secreto ligado al usuario', () => {
  process.env.EMAIL_CODE_SECRET = randomBytes(48).toString('hex');
  const verificationToken = randomBytes(32).toString('hex');
  assert.deepEqual(validateVerification({ verificationToken, code: '012345' }, true), { verificationToken, code: '012345' });
  for (const code of ['12345', '1234567', '12a456', 123456]) assert.throws(() => validateVerification({ verificationToken, code }, true));
  assert.throws(() => validateVerification({ verificationToken, code: '123456', role: 'ADMIN' }, true));
  assert.throws(() => validateVerification({ verificationToken: 'bad' }, false));
  assert.notEqual(hashVerificationCode('1', '012345'), '012345');
  assert.notEqual(hashVerificationCode('1', '012345'), hashVerificationCode('2', '012345'));
  assert.notEqual(hashVerificationToken(verificationToken), verificationToken);
});
