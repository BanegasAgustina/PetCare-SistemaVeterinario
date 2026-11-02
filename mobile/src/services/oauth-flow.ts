/**
 * ARCHIVO: oauth-flow.ts
 * UBICACIÓN: mobile/src/services/oauth-flow.ts
 * FUNCIÓN: Valida respuestas del navegador OAuth y decisiones de compatibilidad de plataforma.
 * RESPONSABILIDAD: Mantener el análisis de callbacks OAuth puro, separado de pantallas y módulos nativos.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/services/oauth.service.ts
 * FUNCIONAMIENTO: Compara origen y ruta con el retorno esperado, acepta solo un ticket hexadecimal de 64 caracteres o errores permitidos.
 * IMPORTANCIA: Reduce la superficie de callbacks aceptados antes de canjear el ticket por una sesión.
 */
/** Validaciones de redirect OAuth que no dependen de UI ni de módulos nativos. */
/** Errores OAuth públicos que el proveedor puede devolver de forma controlada. */
const callbackErrors = new Set(['OAUTH_PROVIDER_DENIED','OAUTH_PROVIDER_ERROR','OAUTH_CODE_MISSING','OAUTH_CALLBACK_FAILED']);

/** Resultado validado del callback: ticket de un solo uso o código de error acotado. */
export type OAuthCallbackResult = { ticket: string } | { error: string };

/** Analiza y valida el callback completo contra la URL de retorno configurada. */
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

/** Expo Go no admite el flujo nativo; web y builds nativos sí pueden iniciarlo. */
export function nativeOAuthSupported(platform:string,runningInExpoGo:boolean):boolean {
  return platform==='web'||!runningInExpoGo;
}

/** Convierte un resultado no exitoso del navegador en el error cancelable del flujo. */
export function oauthBrowserResultError(resultType:string):string|null {
  return resultType==='success'?null:'OAUTH_CANCELLED';
}
