/** Comprueba el límite de autenticación sin consumir bcrypt ni usar MySQL. */
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import express from 'express';
import { createAuthRateLimiter } from '../src/middlewares/auth-rate-limit.middleware';

test('limita intentos y entrega un error JSON seguro', async () => {
  const application = express();
  application.post('/login', createAuthRateLimiter(2), (_request, response) => response.sendStatus(200));
  const server = application.listen(0, '127.0.0.1'); await once(server, 'listening');
  const address = server.address(); assert.ok(address && typeof address !== 'string');
  try {
    const url = `http://127.0.0.1:${address.port}/login`;
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    const response = await fetch(url, { method: 'POST' });
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error.code, 'TOO_MANY_ATTEMPTS');
    assert.ok(response.headers.get('retry-after'));
  } finally { await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())); }
});
