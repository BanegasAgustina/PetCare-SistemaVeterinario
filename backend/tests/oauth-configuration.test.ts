import assert from 'node:assert/strict';
import test from 'node:test';
import { oauthConfigured } from '../src/config/oauth';

test('provider availability is limited to configured credentials and exact platform return URLs', t => {
  const keys = ['BACKEND_URL', 'OAUTH_RETURN_URLS', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_GRAPH_VERSION', 'X_CLIENT_ID', 'X_CLIENT_SECRET', 'TWITTER_CLIENT_ID', 'TWITTER_CLIENT_SECRET'] as const;
  const previous = Object.fromEntries(keys.map(key => [key, process.env[key]]));
  t.after(() => {
    for (const key of keys) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  process.env.BACKEND_URL = 'https://oauth.example.test';
  process.env.OAUTH_RETURN_URLS = 'https://petcare.example.test/oauth,petcare://oauth';
  process.env.GOOGLE_CLIENT_ID = 'test-google-client';
  process.env.GOOGLE_CLIENT_SECRET = 'test-google-secret';
  process.env.FACEBOOK_CLIENT_ID = 'test-facebook-client';
  process.env.FACEBOOK_CLIENT_SECRET = 'test-facebook-secret';
  process.env.FACEBOOK_GRAPH_VERSION = 'v99.0';
  delete process.env.X_CLIENT_ID;
  delete process.env.X_CLIENT_SECRET;
  delete process.env.TWITTER_CLIENT_ID;
  delete process.env.TWITTER_CLIENT_SECRET;

  assert.equal(oauthConfigured('google', 'https://petcare.example.test/oauth'), true);
  assert.equal(oauthConfigured('google', 'petcare://oauth'), true);
  assert.equal(oauthConfigured('google', 'https://unlisted.example.test/oauth'), false);
  assert.equal(oauthConfigured('facebook', 'petcare://oauth'), true);
  assert.equal(oauthConfigured('x', 'petcare://oauth'), false);

  process.env.FACEBOOK_GRAPH_VERSION = 'invalid';
  assert.equal(oauthConfigured('facebook', 'petcare://oauth'), false);
});
