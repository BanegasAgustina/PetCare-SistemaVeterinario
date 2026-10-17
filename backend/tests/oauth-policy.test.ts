import test from 'node:test';
import assert from 'node:assert/strict';
import { assertOAuthRegistrationEmailAvailable, oauthExchangeAction, shouldIssueSessionAfterVerification } from '../src/services/oauth-policy';

test('OAuth uses provider subject links, not email, to choose registration or sign-in', () => {
  for (const provider of ['google', 'facebook', 'x']) {
    assert.equal(oauthExchangeAction('42', null), 'authenticate', `${provider}: existing linked identity`);
    assert.equal(oauthExchangeAction(null, null), 'register', `${provider}: new identity`);
    assert.equal(oauthExchangeAction('42', '42'), 'link', `${provider}: explicit same-account link`);
    assert.equal(oauthExchangeAction(null, '42'), 'link', `${provider}: explicit link`);
    assert.equal(oauthExchangeAction('42', '99'), 'conflict', `${provider}: identity belongs to another account`);
  }
});

test('an existing PetCare email must be explicitly linked instead of merged', () => {
  assert.doesNotThrow(() => assertOAuthRegistrationEmailAvailable(false));
  assert.throws(() => assertOAuthRegistrationEmailAvailable(true), (error: unknown) => {
    assert.equal((error as { code?: string }).code, 'OAUTH_LINK_REQUIRED');
    return true;
  });
});

test('email verification may create a session only for a user with a linked OAuth identity', () => {
  assert.equal(shouldIssueSessionAfterVerification(true), true);
  assert.equal(shouldIssueSessionAfterVerification(false), false);
});
