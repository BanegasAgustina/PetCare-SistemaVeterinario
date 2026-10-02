/** Pruebas HTTP reales en una base local exclusiva; limpia solo sus usuarios temporales. */
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { once } from 'node:events';
import { test } from 'node:test';
import bcrypt from 'bcrypt';
import type { RowDataPacket } from 'mysql2/promise';
import { app } from '../../src/app';
import { env } from '../../src/config/env';
import { databasePool } from '../../src/config/database';
import { createDatabase } from '../../src/database/create-database';
import { runMigrations } from '../../src/database/migration-runner';
import { runSeeds } from '../../src/database/seed-runner';
import { startTestSmtp } from '../helpers/smtp';
import { createAccessToken } from '../../src/services/token.service';

test('autenticación completa con MySQL 8 y regresión de migraciones/seeds', async (suite) => {
  assert.equal(env.nodeEnvironment, 'test');
  assert.ok(['localhost', '127.0.0.1', '::1'].includes(env.database.host));
  assert.ok(env.database.database.endsWith('_test'), 'Usar exclusivamente una base terminada en _test');
  process.env.JWT_ACCESS_SECRET = randomBytes(48).toString('hex');
  process.env.EMAIL_CODE_SECRET = randomBytes(48).toString('hex');
  const smtp = await startTestSmtp();
  Object.assign(process.env, { SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtp.port), SMTP_SECURE: 'false', SMTP_REQUIRE_TLS: 'false', SMTP_USER: '', SMTP_PASSWORD: '', MAIL_FROM: 'petcare@example.com' });
  try {
    await createDatabase();
    await runMigrations();
    assert.equal(await runMigrations(), 0);
    await runSeeds(); await runSeeds();
  } catch (error) { await smtp.close(); await databasePool.end(); throw error; }
  const email = `phase3-${randomUUID()}@example.com`;
  const concurrentEmail = `phase3-${randomUUID()}@example.com`;
  const input = { firstName: 'María', lastName: 'Pérez', email, phone: '+54 (11) 0123-4567', password: 'Prueba!123' };
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}/api/auth`;
  let token = '';
  let proof = ''; let firstProof = ''; let userId = ''; let otherProof = '';
  const currentCode = (recipient: string) => { const code = smtp.messages.filter(message => message.to === recipient).at(-1)?.code; assert.ok(code, 'SMTP debe capturar el correo'); return code; };
  async function post(path: string, body: unknown) {
    const response = await fetch(`${base}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json();
    assert.ok(!JSON.stringify(data).includes('password_hash'));
    assert.ok(!JSON.stringify(data).includes(input.password));
    return { status: response.status, body: data };
  }
  try {
    await suite.test('health de base conserva disponibilidad sin revelar configuración', async () => {
      const response = await fetch(`http://127.0.0.1:${address.port}/api/health/database`);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { success: true, data: { status: 'ok', database: 'available' } });
    });
    await suite.test('registro válido y hash bcrypt, sin privilegios de app', async () => {
      const result = await post('register', { ...input, email: ` ${email.toUpperCase()} ` });
      assert.equal(result.status, 201); assert.equal(result.body.data.user.role, 'CLIENT');
      assert.equal(result.body.data.user.email, email); assert.equal(result.body.data.user.phone, '+541101234567');
      assert.equal(result.body.data.accessToken, undefined);
      proof = firstProof = result.body.data.verification.verificationToken; userId = result.body.data.user.id;
      assert.equal(result.body.data.verification.delivery, 'sent');
      assert.equal(result.body.data.verification.retryAfterSeconds, 45);
      const [verificationRows] = await databasePool.execute<RowDataPacket[]>('SELECT v.code_hash, v.token_hash, u.email_verified_at FROM email_verifications v JOIN users u ON u.id = v.user_id WHERE u.email = ?', [email]);
      assert.equal(verificationRows[0].email_verified_at, null);
      assert.notEqual(verificationRows[0].code_hash, currentCode(email));
      assert.notEqual(verificationRows[0].token_hash, proof);
      assert.equal(result.body.data.verification.code, undefined);
      const [rows] = await databasePool.execute<RowDataPacket[]>('SELECT password_hash FROM users WHERE email = ?', [email]);
      assert.ok(await bcrypt.compare(input.password, rows[0].password_hash as string));
      assert.notEqual(rows[0].password_hash, input.password);
    });
    await suite.test('email repetido', async () => { const result = await post('register', input); assert.equal(result.status, 409); assert.equal(result.body.error.code, 'EMAIL_ALREADY_EXISTS'); });
    await suite.test('email inválido', async () => { assert.equal((await post('register', { ...input, email: 'incorrecto' })).status, 400); });
    await suite.test('contraseña inválida', async () => { assert.equal((await post('register', { ...input, password: 'corta' })).status, 400); });
    await suite.test('rol enviado por cliente rechazado', async () => { assert.equal((await post('register', { ...input, role: 'ADMIN' })).status, 400); });
    await suite.test('registros concurrentes conservan email único', async () => {
      const results = await Promise.all([post('register', { ...input, email: concurrentEmail }), post('register', { ...input, email: concurrentEmail })]);
      assert.deepEqual(results.map((result) => result.status).sort(), [201, 409]);
      otherProof = results.find(result => result.status === 201)!.body.data.verification.verificationToken;
    });
    await suite.test('login pendiente y /me bloqueados; rotar prueba no reinicia límites', async () => {
      const pending = await post('login', { email, password: input.password });
      assert.equal(pending.status, 403); assert.equal(pending.body.error.code, 'EMAIL_NOT_VERIFIED');
      proof = pending.body.error.verification.verificationToken; assert.notEqual(proof, firstProof);
      assert.equal((await post('verify-email', { verificationToken: firstProof, code: currentCode(email) })).status, 401);
      const signed = createAccessToken(userId);
      assert.equal((await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${signed.accessToken}` } })).status, 403);
    });
    await suite.test('código incorrecto persiste intento y resend respeta cooldown', async () => {
      const wrong = currentCode(email) === '000000' ? '999999' : '000000';
      const result = await post('verify-email', { verificationToken: proof, code: wrong });
      assert.equal(result.status, 400); assert.equal(result.body.error.code, 'VERIFICATION_CODE_INVALID');
      const [rows] = await databasePool.execute<RowDataPacket[]>('SELECT attempts FROM email_verifications WHERE user_id = ?', [userId]);
      assert.equal(rows[0].attempts, 1);
      const before = smtp.messages.length;
      const resend = await post('resend-verification', { verificationToken: proof });
      assert.equal(resend.status, 429); assert.equal(resend.body.error.code, 'VERIFICATION_COOLDOWN');
      assert.equal(smtp.messages.length, before);
    });
    await suite.test('verificación concurrente es de un solo uso y actualiza timestamp', async () => {
      const results = await Promise.all([post('verify-email', { verificationToken: proof, code: currentCode(email) }), post('verify-email', { verificationToken: proof, code: currentCode(email) })]);
      assert.deepEqual(results.map(result => result.status).sort(), [200, 409]);
      const [rows] = await databasePool.execute<RowDataPacket[]>('SELECT email_verified_at FROM users WHERE id = ?', [userId]); assert.ok(rows[0].email_verified_at);
    });
    await suite.test('vencimiento, límite de intentos, nuevo código y cuota de reenvío', async () => {
      // Solo esta base de pruebas adelanta plazos para evitar esperas reales de 45 segundos.
      await databasePool.execute('UPDATE email_verifications v JOIN users u ON u.id = v.user_id SET v.expires_at = TIMESTAMPADD(SECOND, -1, UTC_TIMESTAMP(3)) WHERE u.email = ?', [concurrentEmail]);
      assert.equal((await post('verify-email', { verificationToken: otherProof, code: currentCode(concurrentEmail) })).status, 410);
      await databasePool.execute('UPDATE email_verifications v JOIN users u ON u.id = v.user_id SET v.expires_at = TIMESTAMPADD(MINUTE, 10, UTC_TIMESTAMP(3)), v.attempts = 5, v.next_send_at = UTC_TIMESTAMP(3) WHERE u.email = ?', [concurrentEmail]);
      assert.equal((await post('verify-email', { verificationToken: otherProof, code: currentCode(concurrentEmail) })).body.error.code, 'VERIFICATION_ATTEMPTS_EXCEEDED');
      const oldCode = currentCode(concurrentEmail);
      assert.equal((await post('resend-verification', { verificationToken: otherProof })).status, 200);
      assert.notEqual(currentCode(concurrentEmail), oldCode);
      assert.equal((await post('verify-email', { verificationToken: otherProof, code: oldCode })).status, 400);
      await databasePool.execute('UPDATE email_verifications v JOIN users u ON u.id = v.user_id SET v.send_count = 5, v.next_send_at = UTC_TIMESTAMP(3) WHERE u.email = ?', [concurrentEmail]);
      const limited = await post('resend-verification', { verificationToken: otherProof });
      assert.equal(limited.status, 429); assert.equal(limited.body.error.code, 'VERIFICATION_SEND_LIMIT'); assert.ok(limited.body.error.verification.retryAfterSeconds > 0);
    });
    await suite.test('fallo SMTP invalida código, no concede sesión y permite retomar', async () => {
      await databasePool.execute('UPDATE email_verifications v JOIN users u ON u.id = v.user_id SET v.send_count = 0, v.next_send_at = UTC_TIMESTAMP(3) WHERE u.email = ?', [concurrentEmail]);
      smtp.failNext();
      const result = await post('resend-verification', { verificationToken: otherProof });
      assert.equal(result.status, 200); assert.equal(result.body.data.verification.delivery, 'failed'); assert.equal(result.body.data.verification.expiresAt, null);
      assert.equal((await post('login', { email: concurrentEmail, password: input.password })).status, 403);
      assert.equal((await post('verify-email', { verificationToken: 'f'.repeat(64), code: '123456' })).status, 401);
    });
    await suite.test('login válido', async () => { const result = await post('login', { email, password: input.password }); assert.equal(result.status, 200); token = result.body.data.accessToken as string; assert.ok(token); assert.equal(result.body.data.tokenType, 'Bearer'); });
    await suite.test('contraseña incorrecta y usuario inexistente indistinguibles', async () => {
      const wrong = await post('login', { email, password: 'Incorrecta!123' });
      const missing = await post('login', { email: `missing-${email}`, password: input.password });
      assert.equal(wrong.status, 401); assert.equal(missing.status, 401); assert.deepEqual(wrong.body, missing.body);
    });
    await suite.test('/me sin token', async () => { assert.equal((await fetch(`${base}/me`)).status, 401); });
    await suite.test('/me con token', async () => { const response = await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token}` } }); assert.equal(response.status, 200); const body = await response.json(); assert.equal(body.data.user.email, email); assert.equal(body.data.user.passwordHash, undefined); assert.equal(response.headers.get('cache-control'), 'no-store'); });
    await suite.test('falta de secreto JWT devuelve error seguro y conserva health', async () => {
      const secret = process.env.JWT_ACCESS_SECRET;
      try {
        delete process.env.JWT_ACCESS_SECRET;
        const response = await post('login', { email, password: input.password });
        assert.equal(response.status, 503); assert.equal(response.body.error.code, 'AUTH_UNAVAILABLE');
        assert.equal((await fetch(`http://127.0.0.1:${address.port}/api/health`)).status, 200);
      } finally { process.env.JWT_ACCESS_SECRET = secret; }
    });
    await suite.test('token alterado y usuario desactivado', async () => {
      assert.equal((await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token}x` } })).status, 401);
      await databasePool.execute('UPDATE users SET is_active = ? WHERE email = ?', [0, email]);
      assert.equal((await fetch(`${base}/me`, { headers: { Authorization: `Bearer ${token}` } })).status, 401);
      assert.equal((await post('login', { email, password: input.password })).status, 401);
    });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await databasePool.execute('DELETE FROM users WHERE email IN (?, ?)', [email, concurrentEmail]);
    await databasePool.end();
    await smtp.close();
  }
});
