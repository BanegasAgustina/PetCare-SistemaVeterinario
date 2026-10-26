import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApiEndpoint, PRODUCTION_API_URL, resolveApiUrl } from '../src/services/api';

test('preview APK requires an explicit API URL', () => {
  assert.throws(() => resolveApiUrl(undefined, 'preview', false));
});

test('preview APK refuses the production API origin', () => {
  assert.throws(() => resolveApiUrl(PRODUCTION_API_URL, 'preview', false));
});

test('development refuses the production API origin unless explicitly marked production', () => {
  assert.throws(() => resolveApiUrl(PRODUCTION_API_URL, 'development', true));
  assert.throws(() => resolveApiUrl(PRODUCTION_API_URL, undefined, true));
});

test('preview APK accepts an explicit HTTPS API on a different origin', () => {
  assert.equal(
    resolveApiUrl('https://qa.example.test/api', 'preview', false),
    'https://qa.example.test/api',
  );
});

test('production API remains valid when explicitly configured', () => {
  assert.equal(
    resolveApiUrl(PRODUCTION_API_URL, 'production', false),
    PRODUCTION_API_URL,
  );
});

test('production environment rejects an EAS URL override that is not the configured API', () => {
  assert.throws(() => resolveApiUrl('https://wrong.example.test/api', 'production', false));
  assert.throws(() => resolveApiUrl('https://pet-care-sistema-veterinario.vercel.app/other-api', 'production', false));
});

test('API base and routes never duplicate the /api segment', () => {
  assert.equal(resolveApiUrl(PRODUCTION_API_URL, 'production', false), PRODUCTION_API_URL);
  assert.equal(buildApiEndpoint(PRODUCTION_API_URL, '/auth/login'), `${PRODUCTION_API_URL}/auth/login`);
  assert.equal(buildApiEndpoint(PRODUCTION_API_URL, '/api/auth/login'), `${PRODUCTION_API_URL}/auth/login`);
  assert.equal(buildApiEndpoint(PRODUCTION_API_URL, 'auth/login'), `${PRODUCTION_API_URL}/auth/login`);
});
