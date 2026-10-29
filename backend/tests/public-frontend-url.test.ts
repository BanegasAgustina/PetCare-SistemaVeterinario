import assert from 'node:assert/strict';
import test from 'node:test';
import { buildPublicFrontendUrl, type PublicFrontendLinkKind } from '../src/utils/public-frontend-url';

const frontend = 'https://petcare-sistemaveterinario-mobile.vercel.app';
const backend = 'https://pet-care-sistema-veterinario.vercel.app';
const token = 'a'.repeat(64);

const links: Array<[PublicFrontendLinkKind, string]> = [
  ['account-invitation', '/activate-account'],
  ['veterinarian-invitation', '/activate-vet'],
  ['password-reset', '/reset-password'],
];

test('all email flows use the verified public frontend and keep tokens in fragments', () => {
  for (const [kind, route] of links) {
    const url = buildPublicFrontendUrl(kind, token, frontend, 'production', backend);
    assert.equal(url.origin, frontend);
    assert.equal(url.pathname, route);
    assert.equal(url.search, '');
    assert.equal(url.hash, `#token=${token}`);
    assert.equal(`${url.origin}${url.pathname}`, `${frontend}${route}`);
  }
});

test('public frontend validation rejects backend URLs, paths, queries, and insecure production URLs', () => {
  assert.throws(() => buildPublicFrontendUrl('account-invitation', token, backend, 'production', backend));
  assert.throws(() => buildPublicFrontendUrl('account-invitation', token, `${frontend}/activate-account`, 'production', backend));
  assert.throws(() => buildPublicFrontendUrl('password-reset', token, `${frontend}?next=/login`, 'production', backend));
  assert.throws(() => buildPublicFrontendUrl('password-reset', token, 'http://petcare.example.com', 'production', backend));
});

test('development supports a local frontend while still selecting the right routes', () => {
  const url = buildPublicFrontendUrl('account-invitation', token, 'http://localhost:8081', 'development', 'http://localhost:3000');
  assert.equal(url.href, `http://localhost:8081/activate-account#token=${token}`);
});
