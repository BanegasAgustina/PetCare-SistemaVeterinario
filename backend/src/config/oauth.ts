/** Configura proveedores confidenciales. Los secretos y callbacks pertenecen al backend. */
import { AppError } from '../utils/app-error';
export const providers = ['google', 'facebook', 'x'] as const;
export type OAuthProvider = typeof providers[number];
export function oauthProvider(value: unknown): OAuthProvider {
  if (typeof value !== 'string' || !providers.includes(value as OAuthProvider)) throw new AppError('VALIDATION_ERROR',400,'Proveedor no válido.');
  return value as OAuthProvider;
}
export function backendOrigin(): string {
  try {
    const url = new URL(process.env.BACKEND_URL ?? '');
    const local = process.env.NODE_ENV !== 'production' && ['localhost','127.0.0.1'].includes(url.hostname);
    if ((url.protocol !== 'https:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error();
    return url.origin;
  } catch { throw new AppError('OAUTH_UNAVAILABLE',503,'Configurá el origen público del backend.'); }
}
export function oauthConfig(provider: OAuthProvider) {
  const prefix = provider.toUpperCase();
  const clientId = process.env[`${prefix}_CLIENT_ID`]?.trim();
  const clientSecret = process.env[`${prefix}_CLIENT_SECRET`]?.trim();
  const facebookVersion = process.env.FACEBOOK_GRAPH_VERSION?.trim();
  if (!clientId || !clientSecret || (provider === 'facebook' && !/^v\d+\.\d+$/.test(facebookVersion ?? ''))) throw new AppError('OAUTH_UNAVAILABLE',503,'Este proveedor todavía no está configurado.');
  return { clientId, clientSecret, callback: `${backendOrigin()}/api/auth/oauth/${provider}/callback`, facebookVersion };
}
/** Permite informar disponibilidad sin error HTTP cuando faltan credenciales opcionales. */
export function oauthConfigured(provider: OAuthProvider): boolean {
  const prefix = provider.toUpperCase();
  if (!process.env[`${prefix}_CLIENT_ID`]?.trim() || !process.env[`${prefix}_CLIENT_SECRET`]?.trim()) return false;
  if (provider === 'facebook' && !/^v\d+\.\d+$/.test(process.env.FACEBOOK_GRAPH_VERSION?.trim() ?? '')) return false;
  if (!(process.env.OAUTH_RETURN_URLS ?? '').split(',').some(value => value.trim())) return false;
  try { backendOrigin(); return true; } catch { return false; }
}
/** Lista exacta: no aceptar destinos arbitrarios evita redirecciones abiertas y robo de tickets. */
export function oauthReturnUrl(value: unknown): string {
  const allowed = (process.env.OAUTH_RETURN_URLS ?? '').split(',').map(s=>s.trim()).filter(Boolean);
  if (typeof value !== 'string' || !allowed.includes(value)) throw new AppError('VALIDATION_ERROR',400,'El destino OAuth no está autorizado.');
  const url = new URL(value);
  const local = process.env.NODE_ENV !== 'production' && ['localhost','127.0.0.1'].includes(url.hostname);
  if ((url.protocol !== 'https:' && url.protocol !== 'petcare:' && !(local && url.protocol === 'http:')) || url.username || url.password || url.search || url.hash) throw new AppError('VALIDATION_ERROR',400,'El destino OAuth no es válido.');
  return value;
}
