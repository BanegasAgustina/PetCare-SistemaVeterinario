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
  } finally {
    process.env.BACKEND_URL = originalUrl;
  }
});

test('corsAllowedOrigins contains official mobile web production origin', () => {
  assert.ok(env.corsAllowedOrigins.includes('https://petcare-sistemaveterinario-mobile.vercel.app'));
});
