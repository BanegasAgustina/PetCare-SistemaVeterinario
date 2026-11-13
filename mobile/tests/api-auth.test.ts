import assert from 'node:assert/strict';
import test from 'node:test';
import { AUTH_REQUEST_TIMEOUT_MS, buildApiEndpoint, developmentApiUrl, requestTimeoutMs, resolveApiUrl } from '../src/services/api';
import * as authApi from '../src/services/auth.service';

const productionApi = 'https://pet-care-sistema-veterinario.vercel.app/api';

test('Expo Go development config resolves the production API and keeps /api in auth URLs', async () => {
  const configured = developmentApiUrl(undefined, '192.168.1.20:8081', undefined, true, productionApi);
  assert.equal(configured, productionApi);
  assert.equal(resolveApiUrl(configured, 'development', true, true), productionApi);
  assert.equal(buildApiEndpoint(productionApi, '/auth/login'), `${productionApi}/auth/login`);
  assert.equal(buildApiEndpoint(productionApi, '/api/auth/refresh'), `${productionApi}/auth/refresh`);
});

test('login and refresh call /api endpoints and receive the auth timeout allowance', async () => {
  const oldApiUrl = process.env.EXPO_PUBLIC_DEV_API_URL;
  const oldAppEnv = process.env.EXPO_PUBLIC_APP_ENV;
  const oldDev = (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
  const oldFetch = globalThis.fetch;
  const requestedUrls: string[] = [];
  (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = true;
  process.env.EXPO_PUBLIC_DEV_API_URL = productionApi;
  process.env.EXPO_PUBLIC_APP_ENV = 'development';
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    requestedUrls.push(String(input));
    return new Response(JSON.stringify({
      success: true,
      data: {
        user: { id: '1', firstName: 'Ana', lastName: 'Vega', email: 'ana@example.com', phone: null, role: 'CLIENT', permissions: [] },
        accessToken: 'access-token', tokenType: 'Bearer', expiresIn: 900, refreshToken: 'a'.repeat(64),
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }) as typeof fetch;

  try {
    await authApi.login({ email: 'ana@example.com', password: 'valid-password' });
    await authApi.refresh('a'.repeat(64));
    assert.deepEqual(requestedUrls, [
      `${productionApi}/auth/login`,
      `${productionApi}/auth/refresh`,
    ]);
    assert.equal(requestTimeoutMs('/auth/login'), AUTH_REQUEST_TIMEOUT_MS);
    assert.equal(requestTimeoutMs('/api/auth/refresh'), AUTH_REQUEST_TIMEOUT_MS);
    assert.equal(requestTimeoutMs('/auth/me'), 12000);
  } finally {
    globalThis.fetch = oldFetch;
    if (oldApiUrl === undefined) delete process.env.EXPO_PUBLIC_DEV_API_URL;
    else process.env.EXPO_PUBLIC_DEV_API_URL = oldApiUrl;
    if (oldAppEnv === undefined) delete process.env.EXPO_PUBLIC_APP_ENV;
    else process.env.EXPO_PUBLIC_APP_ENV = oldAppEnv;
    if (oldDev === undefined) delete (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
    else (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__ = oldDev;
  }
});
