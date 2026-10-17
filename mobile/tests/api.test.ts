import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCTION_API_URL } from '../src/services/api';

test('PRODUCTION_API_URL is the canonical remote HTTPS production API endpoint', () => {
  assert.equal(PRODUCTION_API_URL, 'https://pet-care-sistema-veterinario.vercel.app/api');
  const url = new URL(PRODUCTION_API_URL);
  assert.equal(url.protocol, 'https:');
  assert.equal(url.hostname, 'pet-care-sistema-veterinario.vercel.app');
  assert.equal(url.pathname, '/api');
});
