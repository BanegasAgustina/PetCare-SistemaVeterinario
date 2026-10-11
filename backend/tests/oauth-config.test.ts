import assert from 'node:assert/strict';
import { test } from 'node:test';
import { oauthConfigured } from '../src/config/oauth';

test('OAuth is available only when the exact web or app return URL is allowlisted', () => {
  const keys = ['NODE_ENV', 'BACKEND_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_GRAPH_VERSION', 'X_CLIENT_ID', 'X_CLIENT_SECRET', 'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'OAUTH_RETURN_URLS'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.NODE_ENV = 'test';
    process.env.BACKEND_URL = 'http://localhost/';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.OAUTH_RETURN_URLS = 'petcare://oauth,https://petcare-sistemaveterinario-mobile.vercel.app/oauth';

    assert.equal(oauthConfigured('google', 'petcare://oauth'), true);
    assert.equal(oauthConfigured('google', 'https://petcare-sistemaveterinario-mobile.vercel.app/oauth'), true);
    assert.equal(oauthConfigured('google', 'https://unlisted.invalid/oauth'), false);
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('X accepts the existing TWITTER_* credential names when X_* are absent', () => {
  const keys = ['NODE_ENV', 'BACKEND_URL', 'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET', 'X_CLIENT_ID', 'X_CLIENT_SECRET', 'OAUTH_RETURN_URLS'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.NODE_ENV = 'test';
    process.env.BACKEND_URL = 'http://localhost/';
    process.env.TWITTER_CLIENT_ID = 'test-x-client-id';
    process.env.TWITTER_CLIENT_SECRET = 'test-x-client-secret';
    delete process.env.X_CLIENT_ID;
    delete process.env.X_CLIENT_SECRET;
    process.env.OAUTH_RETURN_URLS = 'petcare://oauth';
    assert.equal(oauthConfigured('x', 'petcare://oauth'), true);
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});

test('Facebook still requires a valid Graph API version', () => {
  const keys = ['NODE_ENV', 'BACKEND_URL', 'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_GRAPH_VERSION', 'OAUTH_RETURN_URLS'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  try {
    process.env.NODE_ENV = 'test';
    process.env.BACKEND_URL = 'http://localhost/';
    process.env.FACEBOOK_CLIENT_ID = 'test-facebook-client-id';
    process.env.FACEBOOK_CLIENT_SECRET = 'test-facebook-client-secret';
    delete process.env.FACEBOOK_GRAPH_VERSION;
    process.env.OAUTH_RETURN_URLS = 'petcare://oauth';
    assert.equal(oauthConfigured('facebook', 'petcare://oauth'), false);
    process.env.FACEBOOK_GRAPH_VERSION = 'v99.0';
    assert.equal(oauthConfigured('facebook', 'petcare://oauth'), true);
  } finally {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
