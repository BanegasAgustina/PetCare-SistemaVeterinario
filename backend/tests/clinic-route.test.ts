import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { app } from '../src/app';

test('GET /api/clinic/patients is registered and requires authentication', async context => {
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(async () => {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  });

  const address = server.address() as AddressInfo;
  const response = await fetch(`http://127.0.0.1:${address.port}/api/clinic/patients?search=&sort=recent`);
  const body = await response.json() as { error?: { code?: string } };

  assert.equal(response.status, 401);
  assert.equal(body.error?.code, 'AUTH_REQUIRED');
});
