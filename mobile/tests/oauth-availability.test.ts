import assert from 'node:assert/strict';
import test from 'node:test';
import { availableOAuthProviders } from '../src/utils/oauth-availability';

test('only configured OAuth providers are offered, in stable visual order', () => {
  assert.deepEqual(availableOAuthProviders({ x: true, google: true, facebook: false }), ['google', 'x']);
});

test('unknown and missing provider states fail closed', () => {
  assert.deepEqual(availableOAuthProviders({ google: false, facebook: undefined }), []);
});
