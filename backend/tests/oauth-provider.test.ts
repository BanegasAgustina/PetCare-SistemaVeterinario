import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizationUrl, providerIdentity } from '../src/services/oauth-provider.service';
import type { OAuthProvider } from '../src/config/oauth';

test('Google, Facebook, and X OAuth identity handling keeps PKCE and email trust rules', async () => {
  const variables = [
    'BACKEND_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_GRAPH_VERSION', 'X_CLIENT_ID', 'X_CLIENT_SECRET',
  ] as const;
  const previous = new Map(variables.map((name) => [name, process.env[name]]));
  const originalFetch = globalThis.fetch;
  const originalWarn = console.warn;
  Object.assign(process.env, {
    BACKEND_URL: 'https://pet-care-sistema-veterinario.vercel.app',
    GOOGLE_CLIENT_ID: 'google-client',
    GOOGLE_CLIENT_SECRET: 'google-secret',
    FACEBOOK_CLIENT_ID: 'facebook-client',
    FACEBOOK_CLIENT_SECRET: 'facebook-secret',
    FACEBOOK_GRAPH_VERSION: 'v26.0',
    X_CLIENT_ID: 'x-client',
    X_CLIENT_SECRET: 'x-secret',
  });
  try {
    const providers: OAuthProvider[] = ['google', 'facebook', 'x'];
    for (const provider of providers) {
      const url = new URL(authorizationUrl(provider, `state-${provider}`, `challenge-${provider}`));
      assert.equal(url.searchParams.get('state'), `state-${provider}`);
      assert.equal(url.searchParams.get('response_type'), 'code');
      assert.equal(url.searchParams.get('redirect_uri'), `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/${provider}/callback`);
      assert.equal(url.searchParams.get('client_id'), `${provider}-client`);
      assert.equal(url.searchParams.get('code_challenge'), provider === 'facebook' ? null : `challenge-${provider}`);
      assert.equal(url.searchParams.get('code_challenge_method'), provider === 'facebook' ? null : 'S256');
    }

    for (const verified of [true, false]) {
      globalThis.fetch = async (input) => new URL(String(input)).pathname.endsWith('token')
        ? new Response(JSON.stringify({ access_token: 'provider-token' }), { status: 200 })
        : new Response(JSON.stringify({ sub: 'google-subject', email: 'person@example.com', email_verified: verified, name: 'Person' }), { status: 200 });
      const identity = await providerIdentity('google', 'authorization-code', 'pkce-verifier');
      assert.equal(identity.email, verified ? 'person@example.com' : null);
      assert.equal(identity.name, 'Person');
    }

    globalThis.fetch = async (input) => new URL(String(input)).pathname.endsWith('token')
      ? new Response(JSON.stringify({ access_token: 'provider-token' }), { status: 200 })
      : new Response(JSON.stringify({ id: 'facebook-subject', email: 'person@example.com', name: 'Person', data: { id: 'x-subject', name: 'Person' } }), { status: 200 });
    assert.equal((await providerIdentity('facebook', 'authorization-code', 'verifier')).email, null);
    assert.equal((await providerIdentity('x', 'authorization-code', 'verifier')).email, null);

    console.warn = () => undefined;
    globalThis.fetch = async () => new Response(JSON.stringify({ error: 'invalid_grant' }), { status: 400 });
    for (const provider of providers) {
      await assert.rejects(providerIdentity(provider, 'authorization-code', 'verifier'), (error: unknown) => {
        assert.equal((error as { code?: string }).code, 'OAUTH_PROVIDER_ERROR');
        return true;
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
    console.warn = originalWarn;
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
