import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, ApiError } from '../src/services/api';

test('preserves the HTTP status when a gateway returns a non-JSON 503', async () => {
  const oldFetch = globalThis.fetch;
  const oldDev = Object.getOwnPropertyDescriptor(globalThis, '__DEV__');
  const oldApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const warnings: unknown[][] = [];
  const oldWarn = console.warn;
  Object.defineProperty(globalThis, '__DEV__', { configurable: true, value: true });
  process.env.EXPO_PUBLIC_API_URL = 'https://pet-care-sistema-veterinario.vercel.app/api';
  globalThis.fetch = (async () => new Response('<html>unavailable</html>', {
    status: 503,
    headers: { 'Content-Type': 'text/html' },
  })) as typeof fetch;
  console.warn = (...values: unknown[]) => { warnings.push(values); };

  try {
    await assert.rejects(apiRequest('/clinic/patients'), (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'HTTP_ERROR');
      assert.equal(error.status, 503);
      return true;
    });
    assert.equal(warnings.length, 1);
    assert.deepEqual(JSON.parse(String(warnings[0][1])), { code: 'HTTP_ERROR', status: 503 });
  } finally {
    globalThis.fetch = oldFetch;
    console.warn = oldWarn;
    if (oldDev) Object.defineProperty(globalThis, '__DEV__', oldDev);
    else delete (globalThis as typeof globalThis & { __DEV__?: boolean }).__DEV__;
    if (oldApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = oldApiUrl;
  }
});
