/** HTTP route regression tests. No account or database operations are performed. */
import assert from 'node:assert/strict';
import { createServer, type Server } from 'node:http';
import jwt from 'jsonwebtoken';
import test, { after, before } from 'node:test';

// Override dotenv before importing the app; any accidental DB access is pinned to a closed local port.
const testSecret = 'petcare-http-test-secret-only-never-used-outside-this-test';
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '1';
process.env.DB_NAME = 'petcare_test';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = '';
process.env.DB_SSL_MODE = 'disabled';
process.env.JWT_ACCESS_SECRET = testSecret;
process.env.JWT_ISSUER = 'petcare-http-test';
process.env.JWT_AUDIENCE = 'petcare-http-test-client';

let server: Server;
let baseUrl: string;

before(async () => {
  const { app } = await import('../../src/app.js');
  server = createServer(app);
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject);
      const address = server.address();
      if (!address || typeof address === 'string') return reject(new Error('Test server did not bind TCP.'));
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

after(async () => {
  if (server?.listening) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

async function post(path: string, body: unknown, authorization?: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}) },
    body: JSON.stringify(body),
  });
}

test('login validates required fields over the real HTTP route before database access', async () => {
  const response = await post('/api/auth/login', {});
  const payload = await response.json() as { success: boolean; error: { code: string; message: string } };
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, 'VALIDATION_ERROR');
  assert.match(payload.error.message, /email/i);
});

test('registration rejects an invalid body over HTTP without touching email or database services', async () => {
  const response = await post('/api/auth/register', { role: 'ADMIN' });
  const payload = await response.json() as { success: boolean; error: { code: string } };
  assert.equal(response.status, 400);
  assert.equal(payload.success, false);
  assert.equal(payload.error.code, 'VALIDATION_ERROR');
});

test('protected auth and client routes reject requests without a session', async () => {
  for (const path of ['/api/auth/me', '/api/client/pets/query']) {
    const response = await post(path, {});
    const payload = await response.json() as { error: { code: string } };
    assert.equal(response.status, 401, path);
    assert.equal(payload.error.code, 'AUTH_REQUIRED', path);
  }
});

test('protected auth route rejects malformed and expired JWTs before database lookup', async () => {
  const expiredToken = jwt.sign({ sessionVersion: 0 }, testSecret, {
    algorithm: 'HS256', subject: '1', issuer: 'petcare-http-test', audience: 'petcare-http-test-client', expiresIn: -1,
  });

  for (const [token, expectedCode] of [['not-a-jwt', 'INVALID_TOKEN'], [expiredToken, 'TOKEN_EXPIRED']]) {
    const response = await post('/api/auth/me', {}, `Bearer ${token}`);
    const payload = await response.json() as { error: { code: string; message: string } };
    assert.equal(response.status, 401);
    assert.equal(payload.error.code, expectedCode);
    assert.doesNotMatch(payload.error.message, /secret|sql|stack|127\.0\.0\.1/i);
  }
});
