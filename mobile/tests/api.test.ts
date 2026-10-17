import test from 'node:test';
import assert from 'node:assert/strict';
import { apiRequest, PRODUCTION_API_URL } from '../src/services/api';

test('PRODUCTION_API_URL is the canonical remote HTTPS production API endpoint', () => {
  assert.equal(PRODUCTION_API_URL, 'https://pet-care-sistema-veterinario.vercel.app/api');
  const url = new URL(PRODUCTION_API_URL);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'pet-care-sistema-veterinario.vercel.app');
  assert.equal(url.pathname, '/api');
});

test('apiRequest normalizes all supported API base and route prefix combinations', async () => {
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const originalFetch = globalThis.fetch;
  const globalWithDev = globalThis as typeof globalThis & { __DEV__?: boolean };
  const originalDev = globalWithDev.__DEV__;
  globalWithDev.__DEV__ = false;

  try {
    const cases = [
      ['https://pet-care-sistema-veterinario.vercel.app/api', '/auth/login'],
      ['https://pet-care-sistema-veterinario.vercel.app/api', '/api/auth/login'],
      ['https://pet-care-sistema-veterinario.vercel.app', '/api/auth/login'],
    ] as const;

    for (const [baseUrl, path] of cases) {
      process.env.EXPO_PUBLIC_API_URL = baseUrl;
      let requestedUrl = '';
      globalThis.fetch = async (input) => {
        requestedUrl = String(input);
        return new Response(JSON.stringify({ success: true, data: {} }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      };

      await apiRequest(path);
      assert.equal(requestedUrl, 'https://pet-care-sistema-veterinario.vercel.app/api/auth/login');
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
    if (originalDev === undefined) delete globalWithDev.__DEV__;
    else globalWithDev.__DEV__ = originalDev;
  }
});
