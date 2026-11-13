/**
 * ARCHIVO: oauth.ts
 * proceso  oauth
 * UBICACIÓN: backend/src/config/oauth.ts
 * FUNCIÓN: Valida proveedores OAuth, origen público, credenciales y URLs de retorno permitidas.
 * RESPONSABILIDAD: Restringir callbacks y destinos OAuth para evitar redirecciones arbitrarias o configuración local en producción.
 * CONEXIONES: Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/database/oauth-callbacks.ts, backend/src/repositories/oauth.repository.ts, backend/src/services/oauth-provider.service.ts, backend/src/services/oauth.service.ts
 * FUNCIONAMIENTO: Lee secretos de entorno bajo demanda, valida host y allowlist, y entrega estados de disponibilidad sin revelar credenciales.
 * IMPORTANCIA: Los controladores y servicios OAuth dependen de este contrato antes de iniciar una autenticación externa.
 */
import { isIP } from 'node:net';
import { env } from './env';
import { AppError } from '../utils/app-error';
/** Lista de proveedores soportada actualmente por la integración. */
export const providers = ['google', 'facebook', 'x'] as const;
/** Unión de los proveedores aceptados por las funciones de este archivo. */
export type OAuthProvider = typeof providers[number];
/** Valida el nombre externo del proveedor antes de usarlo en rutas o configuración. */
export function oauthProvider(value: unknown): OAuthProvider {
  if (typeof value !== 'string' || !providers.includes(value as OAuthProvider)) throw new AppError('VALIDATION_ERROR',400,'Proveedor no válido.');
  return value as OAuthProvider;
}
/** Valida BACKEND_URL y devuelve solo su origen público seguro. */
export function backendOrigin(): string {
  const isVercelRuntime = Boolean(process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  const isProd = env.nodeEnvironment === 'production' || isVercelRuntime;
  const raw = process.env.BACKEND_URL?.trim();
  if (!raw) throw new AppError('OAUTH_UNAVAILABLE',503,'Configurá el origen público del backend (BACKEND_URL).');

  try {
    const url = new URL(raw);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');
    const ipHostname = hostname.startsWith('[') && hostname.endsWith(']') ? hostname.slice(1, -1) : hostname;
    const isLocal = hostname === 'localhost' || hostname.endsWith('.localhost') ||
      ipHostname === '127.0.0.1' || /^(192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(ipHostname);
    if (isProd && (isLocal || isIP(ipHostname) !== 0)) {
      throw new AppError('OAUTH_UNAVAILABLE',503,'BACKEND_URL debe usar un dominio público HTTPS en producción.');
    }
    const local = !isProd && isLocal;
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new Error();
    const cleanPath = url.pathname.replace(/\/+$/, '');
    if (cleanPath !== '' && cleanPath !== '/api') throw new Error();
    return url.origin;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('OAUTH_UNAVAILABLE',503,'Configurá el origen público del backend (BACKEND_URL debe ser una URL HTTPS válida).');
  }
}
/** Construye client ID/secret y callback de proveedor, o falla si faltan ajustes. */
export function oauthConfig(provider: OAuthProvider) {
  const { clientId, clientSecret } = providerCredentials(provider);
  const facebookVersion = process.env.FACEBOOK_GRAPH_VERSION?.trim();
  if (!clientId || !clientSecret || (provider === 'facebook' && !/^v\d+\.\d+$/.test(facebookVersion ?? ''))) throw new AppError('OAUTH_UNAVAILABLE',503,'Este proveedor todavía no está configurado.');
  return { clientId, clientSecret, callback: `${backendOrigin()}/api/auth/oauth/${provider}/callback`, facebookVersion };
}
/** X usa X_* en configuración nueva y mantiene compatibilidad con despliegues TWITTER_* previos. */
/** Lee credenciales del proveedor y admite alias previos TWITTER_* para X. */
function providerCredentials(provider: OAuthProvider) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim() || (provider === 'x' ? process.env.TWITTER_CLIENT_ID?.trim() : undefined);
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim() || (provider === 'x' ? process.env.TWITTER_CLIENT_SECRET?.trim() : undefined);
  return { clientId, clientSecret };
}
/** Permite informar disponibilidad sin error HTTP cuando faltan credenciales opcionales. */
/** Indica disponibilidad sin error y exige que returnUrl esté en la allowlist exacta. */
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
/** Devuelve una causa pública acotada sin exponer valores secretos de OAuth. */
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
/** Acepta solo retornos incluidos exactamente en OAUTH_RETURN_URLS. */
export function oauthReturnUrl(value: unknown): string {
  const allowed = (process.env.OAUTH_RETURN_URLS ?? '').split(',').map(s=>s.trim()).filter(Boolean);
  if (typeof value !== 'string' || !allowed.includes(value)) throw new AppError('VALIDATION_ERROR',400,'El destino OAuth no está autorizado.');
  const url = new URL(value);
  const isVercelRuntime = Boolean(process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  const local = env.nodeEnvironment !== 'production' && !isVercelRuntime && ['localhost','127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && url.protocol !== 'petcare:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new AppError('VALIDATION_ERROR',400,'El destino OAuth no es válido.');
  return value;
}
