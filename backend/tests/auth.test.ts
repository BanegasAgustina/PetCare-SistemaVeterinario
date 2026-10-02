/** Validaciones y JWT sin depender de una instancia de MySQL. */
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';
import jwt from 'jsonwebtoken';
import { validateRegister } from '../src/validators/auth.validator';
import { createAccessToken, verifyAccessToken } from '../src/services/token.service';

const valid = { firstName: 'María', lastName: 'Pérez', email: ' TEST@example.com ', phone: '+54 (11) 0123-4567', password: 'Prueba!123' };
test('normaliza nombres, email y teléfono sin alterar contraseña', () => {
  const result = validateRegister(valid);
  assert.equal(result.email, 'test@example.com');
  assert.equal(result.phone, '+541101234567');
  assert.equal(result.password, valid.password);
});
test('rechaza nombres numéricos, email, teléfono y contraseñas inválidos', () => {
  for (const change of [{ firstName: 'Ana2' }, { lastName: '' }, { email: 'incorrecto' }, { phone: 12345 }, { password: 'corta' }, { password: 'sinmayuscula!123' }, { password: 'A'.repeat(73) }, { role: 'ADMIN' }, { confirmPassword: valid.password }]) {
    assert.throws(() => validateRegister({ ...valid, ...change }), { code: 'VALIDATION_ERROR' });
  }
});
test('JWT exige firma, algoritmo, audiencia, expiración y sujeto válidos', () => {
  const secret = randomBytes(48).toString('hex');
  process.env.JWT_ACCESS_SECRET = secret;
  const signed = createAccessToken('1');
  assert.equal(verifyAccessToken(signed.accessToken), '1');
  assert.throws(() => verifyAccessToken(`${signed.accessToken}x`), { code: 'INVALID_TOKEN' });
  const options = { subject: '1', issuer: 'petcare-api', audience: 'petcare-mobile' };
  assert.throws(() => verifyAccessToken(jwt.sign({}, secret, { ...options, expiresIn: -1 })), { code: 'TOKEN_EXPIRED' });
  assert.throws(() => verifyAccessToken(jwt.sign({}, secret, { ...options, audience: 'otro', expiresIn: 60 })), { code: 'INVALID_TOKEN' });
  assert.throws(() => verifyAccessToken(jwt.sign({}, secret, { ...options, algorithm: 'HS384', expiresIn: 60 })), { code: 'INVALID_TOKEN' });
});
