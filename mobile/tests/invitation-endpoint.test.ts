import assert from 'node:assert/strict';
import test from 'node:test';
import { apiRequest, buildApiEndpoint, PRODUCTION_API_URL, resolveApiUrl } from '../src/services/api';
import { invitationAcceptancePath } from '../src/services/invitation-paths';

test('account activation POST resolves to the published /api endpoint', () => {
  assert.equal(
    buildApiEndpoint(PRODUCTION_API_URL, invitationAcceptancePath.account),
    'https://pet-care-sistema-veterinario.vercel.app/api/auth/invitations/accept',
  );
});

test('production EXPO_PUBLIC_API_URL without /api still resolves invitation acceptance under /api', () => {
  // Reproduce a Vercel Production variable accidentally configured as the origin only.
  const configuredWithoutApi = 'https://pet-care-sistema-veterinario.vercel.app';
  const normalizedBase = resolveApiUrl(configuredWithoutApi, 'production', false);

  assert.equal(normalizedBase, `${configuredWithoutApi}/api`);
  assert.equal(
    buildApiEndpoint(normalizedBase, invitationAcceptancePath.account),
    'https://pet-care-sistema-veterinario.vercel.app/api/auth/invitations/accept',
  );
});

test('apiRequest posts the invitation token and password to the normalized production URL', async () => {
  const previousApiUrl = process.env.EXPO_PUBLIC_API_URL;
  const previousAppEnvironment = process.env.EXPO_PUBLIC_APP_ENV;
  const previousFetch = globalThis.fetch;
  const runtime = globalThis as typeof globalThis & { __DEV__?: boolean };
  const previousDev = runtime.__DEV__;
  let requestUrl = '';
  let requestMethod = '';
  let requestBody: unknown;

  process.env.EXPO_PUBLIC_API_URL = 'https://pet-care-sistema-veterinario.vercel.app';
  process.env.EXPO_PUBLIC_APP_ENV = 'production';
  runtime.__DEV__ = false;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    requestUrl = String(input);
    requestMethod = init?.method ?? '';
    requestBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ success: true, data: { accepted: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    await apiRequest(invitationAcceptancePath.account, {
      method: 'POST',
      body: { token: 'a'.repeat(64), password: 'A-secure-test-password-123!' },
    });
  } finally {
    globalThis.fetch = previousFetch;
    runtime.__DEV__ = previousDev;
    if (previousApiUrl === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = previousApiUrl;
    if (previousAppEnvironment === undefined) delete process.env.EXPO_PUBLIC_APP_ENV;
    else process.env.EXPO_PUBLIC_APP_ENV = previousAppEnvironment;
  }

  assert.equal(requestUrl, 'https://pet-care-sistema-veterinario.vercel.app/api/auth/invitations/accept');
  assert.equal(requestMethod, 'POST');
  assert.deepEqual(requestBody, { token: 'a'.repeat(64), password: 'A-secure-test-password-123!' });
});

test('already-prefixed callers do not duplicate /api', () => {
  assert.equal(
    buildApiEndpoint(PRODUCTION_API_URL, `/api${invitationAcceptancePath.account}`),
    'https://pet-care-sistema-veterinario.vercel.app/api/auth/invitations/accept',
  );
});
