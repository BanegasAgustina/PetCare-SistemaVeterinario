import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { rateLimit } from 'express-rate-limit';
import { configureProxyTrust } from '../src/middlewares/proxy-trust.middleware';

test('proxy trust is limited to one Vercel hop and disabled outside Vercel', () => {
  const vercelApp = express();
  configureProxyTrust(vercelApp, true);
  assert.equal(vercelApp.get('trust proxy'), 1);

  const localApp = express();
  configureProxyTrust(localApp, false);
  assert.equal(localApp.get('trust proxy'), false);
});

test('rate limiter uses the client IP from Vercel X-Forwarded-For without proxy warnings', async context => {
  const app = express();
  configureProxyTrust(app, true);
  app.use(rateLimit({ windowMs: 60_000, limit: 1, standardHeaders: 'draft-8', legacyHeaders: false }));
  app.get('/ip', (request, response) => response.json({ ip: request.ip }));

  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(async () => {
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  });

  const address = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${address.port}`;
  const messages: unknown[][] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => { messages.push(args); };
  try {
    const request = (ip: string) => fetch(`${origin}/ip`, {
      headers: {
        'X-Forwarded-For': ip,
        Forwarded: `for=${ip};proto=https`,
      },
    });

    const first = await request('198.51.100.10');
    assert.equal(first.status, 200);
    assert.deepEqual(await first.json(), { ip: '198.51.100.10' });

    assert.equal((await request('198.51.100.10')).status, 429);

    const otherClient = await request('198.51.100.11');
    assert.equal(otherClient.status, 200);
    assert.deepEqual(await otherClient.json(), { ip: '198.51.100.11' });
    assert.deepEqual(messages, []);
  } finally {
    console.error = originalError;
  }
});
