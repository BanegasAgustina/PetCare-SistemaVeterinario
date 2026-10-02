/** Regresión de disponibilidad y errores de fases previas, sin necesitar MySQL ni JWT. */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { app } from '../src/app';

test('conserva health y respuestas seguras de error', async () => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const base = `http://127.0.0.1:${address.port}`;
  try {
    const health = await fetch(`${base}/api/health`);
    assert.equal(health.status, 200);
    assert.deepEqual(await health.json(), { success: true, data: { status: 'ok', message: 'PetCare API funcionando' } });
    assert.equal(health.headers.get('x-powered-by'), null);
    assert.equal((await fetch(`${base}/missing`)).status, 404);
    const invalid = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{' });
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error.code, 'INVALID_JSON');
    const oversized = await fetch(`${base}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: 'a'.repeat(110000) }) });
    assert.equal(oversized.status, 413);
    assert.equal((await oversized.json()).error.code, 'PAYLOAD_TOO_LARGE');
    const me = await fetch(`${base}/api/auth/me`);
    assert.equal(me.status, 401);
    assert.deepEqual(await me.json(), { success: false, error: { code: 'AUTH_REQUIRED', message: 'Iniciá sesión para continuar.' } });
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});
