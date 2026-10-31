import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createHmac } from 'node:crypto';
import { authorizationUrl, providerIdentity } from '../src/services/oauth-provider.service';

const originalFetch = globalThis.fetch;

before(() => {
  process.env.BACKEND_URL = 'https://api.petcare.test';
  process.env.FACEBOOK_CLIENT_ID = 'facebook-client';
  process.env.FACEBOOK_CLIENT_SECRET = 'facebook-secret';
  process.env.FACEBOOK_GRAPH_VERSION = 'v26.0';
  process.env.GOOGLE_CLIENT_ID = 'google-client';
  process.env.GOOGLE_CLIENT_SECRET = 'google-secret';
  process.env.X_CLIENT_ID = 'x client:+id';
  process.env.X_CLIENT_SECRET = 'x secret:+value';
});

after(() => {
  globalThis.fetch = originalFetch;
});

test('Facebook exchanges its code with the versioned GET endpoint and reads the profile', async () => {
  const requests: Array<{ url: URL; method: string }> = [];
  globalThis.fetch = (async (input: URL | RequestInfo, init?: RequestInit) => {
    const url = new URL(String(input));
    requests.push({ url, method: init?.method ?? 'GET' });
    return Response.json(url.pathname.endsWith('/oauth/access_token')
      ? { access_token: 'provider-token' }
      : { id: 'fb-user-1', name: 'Facebook User' });
  }) as typeof fetch;

  const identity = await providerIdentity('facebook', 'authorization-code', 'unused-verifier');

  assert.equal(identity.subject, 'fb-user-1');
  assert.equal(requests[0].method, 'GET');
  assert.equal(requests[0].url.pathname, '/v26.0/oauth/access_token');
  assert.equal(requests[0].url.searchParams.get('client_id'), 'facebook-client');
  assert.equal(requests[0].url.searchParams.get('client_secret'), 'facebook-secret');
  assert.equal(requests[0].url.searchParams.get('redirect_uri'), 'https://api.petcare.test/api/auth/oauth/facebook/callback');
  assert.equal(requests[0].url.searchParams.get('code'), 'authorization-code');
  assert.equal(requests[1].url.searchParams.get('appsecret_proof'), createHmac('sha256', 'facebook-secret').update('provider-token').digest('hex'));
});

test('Google keeps its existing token exchange and verified email behavior', async () => {
  const requests: Array<{ url: URL; init: RequestInit }> = [];
  globalThis.fetch = (async (input: URL | RequestInfo, init: RequestInit = {}) => {
    const url = new URL(String(input));
    requests.push({ url, init });
    return Response.json(url.hostname === 'oauth2.googleapis.com'
      ? { access_token: 'provider-token' }
      : { sub: 'google-user-1', name: 'Google User', email: 'verified@example.test', email_verified: true });
  }) as typeof fetch;

  const identity = await providerIdentity('google', 'authorization-code', 'google-verifier');
  const fields = new URLSearchParams(String(requests[0].init.body));

  assert.equal(identity.subject, 'google-user-1');
  assert.equal(identity.email, 'verified@example.test');
  assert.equal(requests[0].init.method, 'POST');
  assert.equal(requests[0].url.href, 'https://oauth2.googleapis.com/token');
  assert.equal(fields.get('grant_type'), 'authorization_code');
  assert.equal(fields.get('client_id'), 'google-client');
  assert.equal(fields.get('client_secret'), 'google-secret');
  assert.equal(fields.get('redirect_uri'), 'https://api.petcare.test/api/auth/oauth/google/callback');
  assert.equal(fields.get('code_verifier'), 'google-verifier');
});

test('X uses a single correctly form-encoded Basic client authentication method', async () => {
  const requests: Array<{ url: URL; init: RequestInit }> = [];
  globalThis.fetch = (async (input: URL | RequestInfo, init: RequestInit = {}) => {
    const url = new URL(String(input));
    requests.push({ url, init });
    return Response.json(url.pathname.endsWith('/2/oauth2/token')
      ? { access_token: 'provider-token' }
    : { data: { id: 'x-user-1', name: 'X User' } });
  }) as typeof fetch;

  const identity = await providerIdentity('x', 'authorization-code', 'pkce-verifier');
  const tokenRequest = requests[0];
  const fields = new URLSearchParams(String(tokenRequest.init.body));
  const formEncode = (value: string) => new URLSearchParams({ value }).toString().slice('value='.length);
  const expectedCredentials = Buffer.from(`${formEncode('x client:+id')}:${formEncode('x secret:+value')}`).toString('base64');

  assert.equal(identity.subject, 'x-user-1');
  assert.equal(identity.email, null);
  assert.equal(tokenRequest.init.method, 'POST');
  assert.equal((tokenRequest.init.headers as Record<string, string>)['Content-Type'], 'application/x-www-form-urlencoded');
  assert.equal((tokenRequest.init.headers as Record<string, string>).Authorization, `Basic ${expectedCredentials}`);
  assert.equal(fields.get('grant_type'), 'authorization_code');
  assert.equal(fields.get('code'), 'authorization-code');
  assert.equal(fields.get('redirect_uri'), 'https://api.petcare.test/api/auth/oauth/x/callback');
  assert.equal(fields.get('code_verifier'), 'pkce-verifier');
  assert.equal(fields.has('client_id'), false);
  assert.equal(fields.has('client_secret'), false);
  assert.equal(requests[1].url.origin + requests[1].url.pathname, 'https://api.x.com/2/users/me');
  assert.equal(requests[1].url.searchParams.get('user.fields'), 'name');
  assert.equal((requests[1].init.headers as Record<string, string>).Authorization, 'Bearer provider-token');
});

test('X authorization requests both tweet.read and users.read', () => {
  const url = new URL(authorizationUrl('x', 'test-state', 'test-challenge'));

  assert.equal(url.origin + url.pathname, 'https://x.com/i/oauth2/authorize');
  assert.deepEqual(url.searchParams.get('scope')?.split(' ').sort(), ['tweet.read', 'users.read']);
  assert.equal(url.searchParams.get('state'), 'test-state');
  assert.equal(url.searchParams.get('code_challenge'), 'test-challenge');
  assert.equal(url.searchParams.get('code_challenge_method'), 'S256');
});

test('X provider failures log only safe diagnostics with the correlation ID', async () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  globalThis.fetch = (async () => Response.json({ error: 'invalid_client', error_description: 'never log this description' }, { status: 401 })) as typeof fetch;
  console.warn = ((message?: unknown) => { warnings.push(String(message)); }) as typeof console.warn;

  try {
    await assert.rejects(providerIdentity('x', 'one-time-code', 'pkce-secret', 'vercel-request-id'), (error: unknown) =>
      error instanceof Error && 'code' in error && error.code === 'OAUTH_PROVIDER_ERROR');
  } finally {
    console.warn = originalWarn;
  }

  const event = warnings.map((line) => JSON.parse(line) as Record<string, unknown>).find((item) => item.event === 'oauth.provider_failure');
  assert.equal(event?.provider, 'x');
  assert.equal(event?.stage, 'token_exchange');
  assert.equal(event?.kind, 'HTTP_ERROR');
  assert.equal(event?.status, 401);
  assert.equal(event?.providerError, 'invalid_client');
  assert.equal(event?.correlationId, 'vercel-request-id');
  assert.equal(warnings.join('\n').includes('never log this description'), false);
  assert.equal(warnings.join('\n').includes('one-time-code'), false);
  assert.equal(warnings.join('\n').includes('pkce-secret'), false);
});

test('X profile HTTP 403 logs sanitized problem fields and identifies client enrollment errors', async () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  let requestCount = 0;
  globalThis.fetch = (async () => {
    requestCount += 1;
    if (requestCount === 1) return Response.json({ access_token: 'provider-token' });
    return Response.json({
      reason: 'client-not-enrolled',
      type: 'https://api.x.com/2/problems/client-not-enrolled',
      title: 'Client not enrolled',
      detail: 'Enrollment failed for code=real-code state=real-state Bearer real-token',
    }, { status: 403 });
  }) as typeof fetch;
  console.warn = ((message?: unknown) => { warnings.push(String(message)); }) as typeof console.warn;

  try {
    await assert.rejects(providerIdentity('x', 'one-time-code', 'pkce-secret', 'vercel-request-id'), (error: unknown) =>
      error instanceof Error && 'code' in error && error.code === 'OAUTH_PROVIDER_ERROR');
  } finally {
    console.warn = originalWarn;
  }

  const event = warnings.map((line) => JSON.parse(line) as Record<string, unknown>).find((item) => item.event === 'oauth.provider_failure');
  assert.equal(event?.provider, 'x');
  assert.equal(event?.stage, 'profile');
  assert.equal(event?.kind, 'HTTP_ERROR');
  assert.equal(event?.status, 403);
  assert.equal(event?.providerError, 'client-not-enrolled');
  assert.equal(event?.reason, 'client-not-enrolled');
  assert.equal(event?.type, 'https://api.x.com/2/problems/client-not-enrolled');
  assert.equal(event?.title, 'Client not enrolled');
  assert.equal(event?.detail, 'Enrollment failed for code=[REDACTED] state=[REDACTED] Bearer [REDACTED]');
  assert.equal(warnings.join('\n').includes('real-code'), false);
  assert.equal(warnings.join('\n').includes('real-state'), false);
  assert.equal(warnings.join('\n').includes('real-token'), false);
  assert.equal(event?.correlationId, 'vercel-request-id');
});
