import test from 'node:test';
import assert from 'node:assert/strict';
import { backendOrigin } from '../src/config/oauth';
import { env } from '../src/config/env';

test('backendOrigin rejects localhost and private IPs in production', () => {
  const originalUrl = process.env.BACKEND_URL;
  try {
    // Should return origin for production URL
    process.env.BACKEND_URL = 'https://pet-care-sistema-veterinario.vercel.app';
    assert.equal(backendOrigin(), 'https://pet-care-sistema-veterinario.vercel.app');

    // Should tolerate trailing slash and normalize origin
    process.env.BACKEND_URL = 'https://pet-care-sistema-veterinario.vercel.app/';
    assert.equal(backendOrigin(), 'https://pet-care-sistema-veterinario.vercel.app');

    // Should tolerate /api path and normalize origin
    process.env.BACKEND_URL = 'https://pet-care-sistema-veterinario.vercel.app/api';
    assert.equal(backendOrigin(), 'https://pet-care-sistema-veterinario.vercel.app');

    // In Vercel runtime, if BACKEND_URL was left as localhost, it resolves to PRODUCTION_BACKEND_URL
    const originalRegion = process.env.VERCEL_REGION;
    try {
      process.env.VERCEL_REGION = 'iad1';
      process.env.BACKEND_URL = 'http://localhost:3000';
      assert.equal(backendOrigin(), 'https://pet-care-sistema-veterinario.vercel.app');
    } finally {
      process.env.VERCEL_REGION = originalRegion;
    }
  } finally {
    process.env.BACKEND_URL = originalUrl;
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
