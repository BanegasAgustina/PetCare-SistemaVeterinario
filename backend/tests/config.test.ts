import test from 'node:test';
import assert from 'node:assert/strict';
import { backendOrigin } from '../src/config/oauth';
import { env } from '../src/config/env';

test('backendOrigin requires a public HTTPS domain in production', () => {
  const originalUrl = process.env.BACKEND_URL;
  const originalRegion = process.env.VERCEL_REGION;
  try {
    process.env.VERCEL_REGION = 'iad1';
    process.env.BACKEND_URL = 'https://pet-care-sistema-veterinario.vercel.app';
    assert.equal(backendOrigin(), 'https://pet-care-sistema-veterinario.vercel.app');

    process.env.BACKEND_URL = 'https://pet-care-sistema-veterinario.vercel.app/';
    assert.equal(backendOrigin(), 'https://pet-care-sistema-veterinario.vercel.app');

    process.env.BACKEND_URL = 'https://pet-care-sistema-veterinario.vercel.app/api';
    assert.equal(backendOrigin(), 'https://pet-care-sistema-veterinario.vercel.app');

    for (const value of [
      'http://localhost:3000',
      'https://service.localhost',
      'https://127.0.0.1',
      'https://127.0.0.2',
      'https://10.0.0.1',
      'https://172.16.0.1',
      'https://192.168.1.1',
      'https://[::1]',
      'https://[fd00::1]',
      'https://[fe80::1]',
    ]) {
      process.env.BACKEND_URL = value;
      assert.throws(() => backendOrigin(), { code: 'OAUTH_UNAVAILABLE' }, value);
    }

    delete process.env.BACKEND_URL;
    assert.throws(() => backendOrigin(), { code: 'OAUTH_UNAVAILABLE' });
  } finally {
    if (originalRegion === undefined) delete process.env.VERCEL_REGION;
    else process.env.VERCEL_REGION = originalRegion;
    if (originalUrl === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = originalUrl;
  }
});

test('corsAllowedOrigins contains official mobile web production origin', () => {
  assert.ok(env.corsAllowedOrigins.includes('https://petcare-sistemaveterinario-mobile.vercel.app'));
});

test('CORS allows PetCare Vercel preview deployments and rejects unrelated origins', () => {
  assert.equal(env.isCorsOriginAllowed('https://petcare-sistemaveterinario-mobile-dnne6sivd.vercel.app'), true);
  assert.equal(env.isCorsOriginAllowed('https://petcare-sistemaveterinario-mobile-git-feature.vercel.app'), true);
  assert.equal(env.isCorsOriginAllowed('https://petcare-sistemaveterinario-mobile.vercel.app.attacker.test'), false);
  assert.equal(env.isCorsOriginAllowed('http://petcare-sistemaveterinario-mobile-dnne6sivd.vercel.app'), false);
  assert.equal(env.isCorsOriginAllowed('https://other-project-dnne6sivd.vercel.app'), false);
});
