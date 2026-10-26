import assert from 'node:assert/strict';
import test from 'node:test';
import { buildApiEndpoint, developmentApiUrl, PRODUCTION_API_URL, resolveApiUrl } from '../src/services/api';

test('development uses the API service on Expo host rather than the production API URL', () => {
  assert.equal(developmentApiUrl(PRODUCTION_API_URL,'192.168.100.17:8081',undefined,true),'http://192.168.100.17:3000/api');
});

test('explicit HTTPS development API takes priority over local and Metro fallback settings', () => {
  const remote='https://pet-care-sistema-veterinario.vercel.app/api';
  const selected=developmentApiUrl(PRODUCTION_API_URL,'192.168.100.17:8081',undefined,true,remote);
  assert.equal(selected,remote);
  assert.equal(resolveApiUrl(selected,'development',true,true),remote);
});

test('explicit development API URL must use HTTPS and cannot affect release builds', () => {
  assert.throws(()=>resolveApiUrl('http://api.example.test/api','development',true,true));
  assert.throws(()=>resolveApiUrl('https://api.example.test/api','production',false,true));
});

test('development keeps an explicitly configured non-production API URL', () => {
  assert.equal(developmentApiUrl('http://10.0.2.2:3000/api','192.168.100.17:8081',undefined,true),'http://10.0.2.2:3000/api');
});

test('release API selection never derives an address from the Metro host', () => {
  assert.equal(developmentApiUrl(undefined,'192.168.100.17:8081',undefined,false),undefined);
});

test('development API port can be configured without hardcoding an address', () => {
  assert.equal(developmentApiUrl(undefined,'192.168.100.17:8081','3001',true),'http://192.168.100.17:3001/api');
});

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
