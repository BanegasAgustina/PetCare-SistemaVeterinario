import assert from 'node:assert/strict';
import test from 'node:test';
import { nativeOAuthSupported, oauthBrowserResultError, parseOAuthCallback } from '../src/services/oauth-flow';

const returnUrl = 'petcare://oauth';
const ticket = 'a'.repeat(64);

test('native provider authorization is unavailable inside Expo Go but remains available to web and builds', () => {
  assert.equal(nativeOAuthSupported('android', true), false);
  assert.equal(nativeOAuthSupported('android', false), true);
  assert.equal(nativeOAuthSupported('web', true), true);
});

test('a valid callback accepts only the expected origin, path, and one-time ticket shape', () => {
  assert.deepEqual(parseOAuthCallback(`${returnUrl}?ticket=${ticket}`, returnUrl), { ticket });
  assert.throws(() => parseOAuthCallback(`petcare://other?ticket=${ticket}`, returnUrl), { message: 'OAUTH_FAILED' });
  assert.throws(() => parseOAuthCallback(`${returnUrl}?ticket=short`, returnUrl), { message: 'INVALID_RESPONSE' });
  assert.throws(() => parseOAuthCallback(`${returnUrl}?ticket=${ticket}&error=denied`, returnUrl), { message: 'INVALID_RESPONSE' });
});

test('provider cancellation and provider denial return safe error states', () => {
  assert.equal(oauthBrowserResultError('cancel'), 'OAUTH_CANCELLED');
  assert.equal(oauthBrowserResultError('success'), null);
  assert.deepEqual(parseOAuthCallback(`${returnUrl}?error=OAUTH_PROVIDER_DENIED`, returnUrl), { error: 'OAUTH_PROVIDER_DENIED' });
});
