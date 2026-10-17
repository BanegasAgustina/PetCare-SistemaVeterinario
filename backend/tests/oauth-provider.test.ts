import test from 'node:test';
import assert from 'node:assert/strict';
import { authorizationUrl } from '../src/services/oauth-provider.service';
import type { OAuthProvider } from '../src/config/oauth';

test('Google, Facebook, and X authorization URLs keep state and provider-specific PKCE', () => {
  const variables = [
    'BACKEND_URL',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FACEBOOK_CLIENT_ID',
    'FACEBOOK_CLIENT_SECRET',
    'FACEBOOK_GRAPH_VERSION',
    'X_CLIENT_ID',
    'X_CLIENT_SECRET',
  ] as const;
  const previous = new Map(variables.map((name) => [name, process.env[name]]));
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
      const state = `state-${provider}`;
      const challenge = `challenge-${provider}`;
      const url = new URL(authorizationUrl(provider, state, challenge));
      assert.equal(url.searchParams.get('state'), state);
      assert.equal(url.searchParams.get('response_type'), 'code');
      assert.equal(url.searchParams.get('redirect_uri'), `https://pet-care-sistema-veterinario.vercel.app/api/auth/oauth/${provider}/callback`);
      assert.equal(url.searchParams.get('client_id'), `${provider}-client`);
      assert.equal(url.searchParams.get('code_challenge'), provider === 'facebook' ? null : challenge);
      assert.equal(url.searchParams.get('code_challenge_method'), provider === 'facebook' ? null : 'S256');
    }
  } finally {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  }
});
