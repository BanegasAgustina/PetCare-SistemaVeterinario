import { env } from './env';
import { AppError } from '../utils/app-error';
export const providers = ['google', 'facebook', 'x'] as const;
export type OAuthProvider = typeof providers[number];
export function oauthProvider(value: unknown): OAuthProvider {
  if (typeof value !== 'string' || !providers.includes(value as OAuthProvider)) throw new AppError('VALIDATION_ERROR',400,'Proveedor no válido.');
  return value as OAuthProvider;
}
export function backendOrigin(): string {
  const raw = process.env.BACKEND_URL?.trim();
  if (!raw) throw new AppError('OAUTH_UNAVAILABLE',503,'Configurá el origen público del backend (BACKEND_URL).');
  try {
    const url = new URL(raw);
    const isLocal = ['localhost', '127.0.0.1'].includes(url.hostname) || /^(192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    if (env.nodeEnvironment === 'production' && isLocal) {
      throw new AppError('OAUTH_UNAVAILABLE',503,'BACKEND_URL no puede apuntar a localhost ni a una red local en producción. Configurá https://pet-care-sistema-veterinario.vercel.app');
    }
    const local = env.nodeEnvironment !== 'production' && isLocal;
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new Error();
    const cleanPath = url.pathname.replace(/\/+$/, '');
    if (cleanPath !== '' && cleanPath !== '/api') throw new Error();
    return url.origin;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('OAUTH_UNAVAILABLE',503,'Configurá el origen público del backend (BACKEND_URL debe ser una URL HTTPS válida).');
  }
}
export function oauthConfig(provider: OAuthProvider) {
  const { clientId, clientSecret } = providerCredentials(provider);
  const facebookVersion = process.env.FACEBOOK_GRAPH_VERSION?.trim();
  if (!clientId || !clientSecret || (provider === 'facebook' && !/^v\d+\.\d+$/.test(facebookVersion ?? ''))) throw new AppError('OAUTH_UNAVAILABLE',503,'Este proveedor todavía no está configurado.');
  return { clientId, clientSecret, callback: `${backendOrigin()}/api/auth/oauth/${provider}/callback`, facebookVersion };
}
/** X usa X_* en configuración nueva y mantiene compatibilidad con despliegues TWITTER_* previos. */
function providerCredentials(provider: OAuthProvider) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim() || (provider === 'x' ? process.env.TWITTER_CLIENT_ID?.trim() : undefined);
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim() || (provider === 'x' ? process.env.TWITTER_CLIENT_SECRET?.trim() : undefined);
  return { clientId, clientSecret };
}
/** Permite informar disponibilidad sin error HTTP cuando faltan credenciales opcionales. */
export function oauthConfigured(provider: OAuthProvider, returnUrl?: unknown): boolean {
  const { clientId, clientSecret } = providerCredentials(provider);
  if (!clientId || !clientSecret) return false;
  if (provider === 'facebook' && !/^v\d+\.\d+$/.test(process.env.FACEBOOK_GRAPH_VERSION?.trim() ?? '')) return false;
  const allowedReturnUrls = (process.env.OAUTH_RETURN_URLS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  if (!allowedReturnUrls.length) return false;
  // Report the provider unavailable to this client when its precise web/native
  // return target is not allowlisted; otherwise start would fail later with 400.
  if (returnUrl !== undefined && (typeof returnUrl !== 'string' || !allowedReturnUrls.includes(returnUrl))) return false;
  try { backendOrigin(); return true; } catch { return false; }
}
/** Diagnóstico acotado para el cliente: nunca devuelve valores de configuración. */
export function oauthConfigurationIssue(provider: OAuthProvider, returnUrl?: unknown): string | null {
  const { clientId, clientSecret } = providerCredentials(provider);
  if (!clientId || !clientSecret) return 'CREDENTIALS_MISSING';
  if (provider === 'facebook' && !/^v\d+\.\d+$/.test(process.env.FACEBOOK_GRAPH_VERSION?.trim() ?? '')) return 'PROVIDER_SETTINGS_INVALID';
  const allowed = (process.env.OAUTH_RETURN_URLS ?? '').split(',').map(value => value.trim()).filter(Boolean);
  if (!allowed.length || (returnUrl !== undefined && (typeof returnUrl !== 'string' || !allowed.includes(returnUrl)))) return 'RETURN_URL_NOT_ALLOWED';
  try { backendOrigin(); } catch { return 'BACKEND_URL_INVALID'; }
  return null;
}
/** Lista exacta: no aceptar destinos arbitrarios evita redirecciones abiertas y robo de tickets. */
export function oauthReturnUrl(value: unknown): string {
  const allowed = (process.env.OAUTH_RETURN_URLS ?? '').split(',').map(s=>s.trim()).filter(Boolean);
  if (typeof value !== 'string' || !allowed.includes(value)) throw new AppError('VALIDATION_ERROR',400,'El destino OAuth no está autorizado.');
  const url = new URL(value);
  const local = env.nodeEnvironment !== 'production' && ['localhost','127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && url.protocol !== 'petcare:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new AppError('VALIDATION_ERROR',400,'El destino OAuth no es válido.');
  return value;
}
