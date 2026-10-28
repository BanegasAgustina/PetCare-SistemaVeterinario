import assert from 'node:assert/strict';
import test from 'node:test';
import { assertOAuthRegistrationEmailAvailable, oauthExchangeAction, shouldIssueSessionAfterVerification } from '../src/services/oauth-policy';

test('new provider identities enter public customer registration', () => {
  assert.equal(oauthExchangeAction(null, null), 'register');
});

test('an already linked identity authenticates the same account and preserves its role', () => {
  assert.equal(oauthExchangeAction('user-1', null), 'authenticate');
});

test('provider linking requires the authenticated owner and rejects a different owner', () => {
  assert.equal(oauthExchangeAction(null, 'user-1'), 'link');
  assert.equal(oauthExchangeAction('user-1', 'user-1'), 'link');
  assert.equal(oauthExchangeAction('user-2', 'user-1'), 'conflict');
});

test('matching email never automatically links an OAuth identity', () => {
  assert.throws(() => assertOAuthRegistrationEmailAvailable(true), { code: 'OAUTH_LINK_REQUIRED', status: 409 });
  assert.doesNotThrow(() => assertOAuthRegistrationEmailAvailable(false));
});

test('a new OAuth identity must verify its PetCare email before a session is issued', () => {
  assert.equal(shouldIssueSessionAfterVerification(false), false);
  assert.equal(shouldIssueSessionAfterVerification(true), true);
});
