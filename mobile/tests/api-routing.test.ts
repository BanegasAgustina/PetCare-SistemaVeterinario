import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { ApiError, apiRequest, buildApiEndpoint, developmentApiUrl, PRODUCTION_API_URL, resolveApiUrl } from '../src/services/api';

const originalFetch = globalThis.fetch;
const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
const originalAppEnv = process.env.EXPO_PUBLIC_APP_ENV;
const productionOrigin = PRODUCTION_API_URL.replace(/\/api\/?$/, '');

beforeEach(() => {
  (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = false;
  // Reproduce Vercel project env configured with the origin but without its API suffix.
  process.env.EXPO_PUBLIC_API_URL = productionOrigin;
  process.env.EXPO_PUBLIC_APP_ENV = 'production';
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
  else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  if (originalAppEnv === undefined) delete process.env.EXPO_PUBLIC_APP_ENV;
  else process.env.EXPO_PUBLIC_APP_ENV = originalAppEnv;
});

test('missing /api in EXPO_PUBLIC_API_URL is normalized for a production build', () => {
  assert.equal(resolveApiUrl(productionOrigin, 'production', false), PRODUCTION_API_URL);
  assert.equal(buildApiEndpoint(resolveApiUrl(productionOrigin, 'production', false), '/auth/invitations/accept'),
    'https://pet-care-sistema-veterinario.vercel.app/api/auth/invitations/accept');
});

test('API endpoint builder preserves /api and does not duplicate it', () => {
  assert.equal(buildApiEndpoint(productionOrigin, '/auth/invitations/accept'), 'https://pet-care-sistema-veterinario.vercel.app/api/auth/invitations/accept');
  assert.equal(buildApiEndpoint(PRODUCTION_API_URL, '/auth/invitations/accept'), `${PRODUCTION_API_URL}/auth/invitations/accept`);
  assert.equal(buildApiEndpoint(PRODUCTION_API_URL, '/api/auth/invitations/accept'), `${PRODUCTION_API_URL}/auth/invitations/accept`);
});

test('development API configuration resolves to an /api base', () => {
  const localBase = developmentApiUrl('http://localhost:3000/api', undefined, undefined, true);
  assert.equal(resolveApiUrl(localBase, 'development', true), 'http://localhost:3000/api');
});

test('invitation acceptance POST reaches the API route and sends the token in JSON', async () => {
  let capturedUrl = '';
  let capturedBody: unknown;
  globalThis.fetch = async (input, init) => {
    capturedUrl = String(input);
    capturedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ success: true, data: { accepted: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const token = 'a'.repeat(64);
  for (const path of ['/auth/invitations/accept', '/auth/veterinarian-invitations/accept']) {
    await apiRequest(path, { method: 'POST', body: { token, password: 'TestPass123!' } });
    assert.equal(capturedUrl, `https://pet-care-sistema-veterinario.vercel.app/api${path}`);
    assert.deepEqual(capturedBody, { token, password: 'TestPass123!' });
    assert.equal(new URL(capturedUrl).search, '');
  }
});

test('a platform HTML 404 is distinguishable from the backend JSON 404', async () => {
  globalThis.fetch = async () => new Response('<!doctype html><title>404</title>', {
    status: 404,
    headers: { 'Content-Type': 'text/html' },
  });

  await assert.rejects(apiRequest('/auth/invitations/accept', { method: 'POST', body: { token: 'a'.repeat(64), password: 'TestPass123!' } }),
    error => error instanceof ApiError && error.code === 'HTTP_ERROR' && error.status === 404);

  globalThis.fetch = async () => new Response(JSON.stringify({ success: false, error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });

  await assert.rejects(apiRequest('/auth/invitations/accept', { method: 'POST', body: { token: 'a'.repeat(64), password: 'TestPass123!' } }),
    error => error instanceof ApiError && error.code === 'NOT_FOUND' && error.status === 404);
});
