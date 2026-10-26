import assert from 'node:assert/strict';
import test from 'node:test';
import { nativeOAuthSupported,oauthBrowserResultError,parseOAuthCallback } from '../src/services/oauth-flow';

const destination='petcare://oauth';
const ticket='a'.repeat(64);

test('native OAuth callback accepts only a one-time ticket on the registered app scheme',()=>{
  assert.deepEqual(parseOAuthCallback(`${destination}?ticket=${ticket}`,destination),{ticket});
});

test('native OAuth callback reports known provider cancellation without exposing callback data',()=>{
  assert.deepEqual(parseOAuthCallback(`${destination}?error=OAUTH_PROVIDER_DENIED`,destination),{error:'OAUTH_PROVIDER_DENIED'});
});

test('native OAuth callback rejects a redirect to another scheme or route',()=>{
  assert.throws(()=>parseOAuthCallback(`exp://192.168.1.2:8081/--/oauth?ticket=${ticket}`,destination),/OAUTH_FAILED/);
  assert.throws(()=>parseOAuthCallback(`petcare://other?ticket=${ticket}`,destination),/OAUTH_FAILED/);
});

test('native OAuth callback rejects missing, malformed, duplicated, and unexpected parameters',()=>{
  assert.throws(()=>parseOAuthCallback(destination,destination),/INVALID_RESPONSE/);
  assert.throws(()=>parseOAuthCallback(`${destination}?ticket=bad`,destination),/INVALID_RESPONSE/);
  assert.throws(()=>parseOAuthCallback(`${destination}?ticket=${ticket}&access_token=secret`,destination),/INVALID_RESPONSE/);
  assert.deepEqual(parseOAuthCallback(`${destination}?error=unknown_provider_detail`,destination),{error:'OAUTH_FAILED'});
});

test('all native providers require an installed development build rather than Expo Go',()=>{
  assert.equal(nativeOAuthSupported('android',true),false);
  assert.equal(nativeOAuthSupported('ios',true),false);
  assert.equal(nativeOAuthSupported('android',false),true);
  assert.equal(nativeOAuthSupported('web',true),true);
});

test('browser cancellation releases the social-login action; successful redirects continue',()=>{
  assert.equal(oauthBrowserResultError('cancel'),'OAUTH_CANCELLED');
  assert.equal(oauthBrowserResultError('dismiss'),'OAUTH_CANCELLED');
  assert.equal(oauthBrowserResultError('success'),null);
});
