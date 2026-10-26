/** Validaciones de redirect OAuth que no dependen de UI ni de módulos nativos. */
const callbackErrors = new Set(['OAUTH_PROVIDER_DENIED','OAUTH_PROVIDER_ERROR','OAUTH_CODE_MISSING','OAUTH_CALLBACK_FAILED']);

export type OAuthCallbackResult = { ticket: string } | { error: string };

export function parseOAuthCallback(value:string,expectedReturnUrl:string):OAuthCallbackResult {
  let callback:URL,expected:URL;
  try { callback=new URL(value);expected=new URL(expectedReturnUrl); }
  catch { throw new Error('OAUTH_FAILED'); }
  if(callback.protocol!==expected.protocol||callback.host!==expected.host||callback.pathname!==expected.pathname||callback.hash)throw new Error('OAUTH_FAILED');
  const entries=[...callback.searchParams.entries()];
  if(entries.length!==1)throw new Error('INVALID_RESPONSE');
  const [key,result]=entries[0];
  if(key==='error')return {error:callbackErrors.has(result)?result:'OAUTH_FAILED'};
  if(key==='ticket'&&/^[a-f0-9]{64}$/.test(result))return {ticket:result};
  throw new Error('INVALID_RESPONSE');
}

export function nativeOAuthSupported(platform:string,runningInExpoGo:boolean):boolean {
  return platform==='web'||!runningInExpoGo;
}

export function oauthBrowserResultError(resultType:string):string|null {
  return resultType==='success'?null:'OAUTH_CANCELLED';
}
