import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createHmac } from 'node:crypto';
import { providerIdentity } from '../src/services/oauth-provider.service';

const originalFetch = globalThis.fetch;

before(() => {
  process.env.BACKEND_URL = 'https://api.petcare.test';
  process.env.FACEBOOK_CLIENT_ID = 'facebook-client';
  process.env.FACEBOOK_CLIENT_SECRET = 'facebook-secret';
  process.env.FACEBOOK_GRAPH_VERSION = 'v26.0';
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
  assert.equal(tokenRequest.init.method, 'POST');
  assert.equal((tokenRequest.init.headers as Record<string, string>).Authorization, `Basic ${expectedCredentials}`);
  assert.equal(fields.get('grant_type'), 'authorization_code');
  assert.equal(fields.get('code'), 'authorization-code');
  assert.equal(fields.get('redirect_uri'), 'https://api.petcare.test/api/auth/oauth/x/callback');
  assert.equal(fields.get('code_verifier'), 'pkce-verifier');
  assert.equal(fields.has('client_id'), false);
  assert.equal(fields.has('client_secret'), false);
});
