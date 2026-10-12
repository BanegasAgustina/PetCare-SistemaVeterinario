import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import type { Server } from 'node:http';
import { app } from '../src/app';

const frontendOrigin = 'https://petcare-sistemaveterinario-mobile-drpos021a.vercel.app';
let server: Server;
let baseUrl: string;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise<void>((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No se pudo iniciar el servidor de prueba.');
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server) await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

test('el preflight de login permite el origen Vercel exacto y los headers JSON', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'OPTIONS',
    headers: {
      Origin: frontendOrigin,
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  });

  assert.equal(response.status, 204);
  assert.equal(response.headers.get('access-control-allow-origin'), frontendOrigin);
  assert.match(response.headers.get('access-control-allow-methods') ?? '', /POST/);
  assert.match(response.headers.get('access-control-allow-headers') ?? '', /content-type/i);
  assert.equal(response.headers.get('access-control-allow-credentials'), null);
});

test('una respuesta de error conserva CORS para un origen permitido', async () => {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { Origin: frontendOrigin, 'Content-Type': 'application/json' },
    body: '{',
  });

  assert.equal(response.status, 400);
  assert.equal(response.headers.get('access-control-allow-origin'), frontendOrigin);
});
