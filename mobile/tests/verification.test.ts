/// <reference types="node" />
/** Contratos verificables sin nuevas dependencias ni credenciales reales. */
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { maskEmail } from '../src/utils/mask-email';
import { registrationPayload, validateRegistrationForm } from '../src/utils/auth-validation';
import { readVerification, resendCode, verifyCode } from '../src/services/verification.service';
test('máscara y nombre completo conservan el contrato anterior', () => {
  assert.equal(maskEmail('agustin@example.com'), 'ag***@example.com');
  assert.equal(maskEmail('a@example.com'), 'a***@example.com');
  const values = { fullName: ' María Pérez López ', email: 'maria@example.com', phone: '', password: 'Prueba!123', confirmPassword: 'Prueba!123' };
  assert.deepEqual(validateRegistrationForm(values), {});
  assert.equal(registrationPayload(values).lastName, 'Pérez López');
  assert.ok(validateRegistrationForm({ ...values, fullName: 'Ana2 Pérez' }).fullName);
  assert.ok(validateRegistrationForm({ ...values, fullName: 'María' }).fullName);
});
test('verify/resend envían exclusivamente código y prueba opaca', async () => {
  const originalFetch = globalThis.fetch; const originalUrl = process.env.EXPO_PUBLIC_API_URL;
  const verificationToken = 'a'.repeat(64);
  const challenge = { verificationToken, maskedEmail: 'ag***@example.com', retryAfterSeconds: 45, expiresAt: new Date(Date.now() + 600000).toISOString(), delivery: 'sent' };
  process.env.EXPO_PUBLIC_API_URL = 'http://localhost:3000/api';
  const bodies: unknown[] = [];
  globalThis.fetch = async (url, options) => { bodies.push(JSON.parse(String(options?.body))); return new Response(JSON.stringify({ success: true, data: String(url).endsWith('verify-email') ? { verified: true } : { verification: challenge } }), { status: 200 }); };
  try {
    await verifyCode(verificationToken, '012345');
    assert.equal((await resendCode(verificationToken)).retryAfterSeconds, 45);
    assert.deepEqual(bodies, [{ verificationToken, code: '012345' }, { verificationToken }]);
    assert.throws(() => readVerification({ ...challenge, verificationToken: 'invalid' }));
    assert.throws(() => readVerification({ ...challenge, retryAfterSeconds: -1 }));
  } finally { globalThis.fetch = originalFetch; if (originalUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL; else process.env.EXPO_PUBLIC_API_URL = originalUrl; }
});
