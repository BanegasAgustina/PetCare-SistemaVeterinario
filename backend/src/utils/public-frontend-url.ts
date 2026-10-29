// Este archivo se encarga de lo siguiente: Construye enlaces públicos de PetCare desde un único origen frontend validado.

import { AppError } from './app-error';

export type PublicFrontendLinkKind = 'account-invitation' | 'veterinarian-invitation' | 'password-reset';

const paths: Record<PublicFrontendLinkKind, string> = {
  'account-invitation': '/activate-account',
  'veterinarian-invitation': '/activate-vet',
  'password-reset': '/reset-password',
};

/** Pure URL builder so every email flow can be regression-tested without SMTP or database access. */
export function buildPublicFrontendUrl(
  kind: PublicFrontendLinkKind,
  token: string | undefined,
  configuredBase: string | undefined,
  nodeEnvironment: string,
  backendUrl?: string,
): URL {
  const unavailable = () => new AppError(kind === 'password-reset' ? 'PASSWORD_RESET_UNAVAILABLE' : 'INVITATION_UNAVAILABLE', 503,
    kind === 'password-reset' ? 'La recuperación de contraseña no está configurada.' : 'Configurá la URL pública segura del frontend.');
  try {
    const url = new URL(configuredBase?.trim() ?? '');
    const localHost = ['localhost', '127.0.0.1', '::1'].includes(url.hostname) || /^(192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    if (url.username || url.password || url.search || url.hash || (url.pathname !== '/' && url.pathname !== '') ||
      (nodeEnvironment === 'production' && localHost) ||
      (url.protocol !== 'https:' && !(nodeEnvironment !== 'production' && localHost && url.protocol === 'http:'))) throw unavailable();
    if (backendUrl) {
      try { if (url.origin === new URL(backendUrl).origin) throw unavailable(); }
      catch (error) { if (error instanceof AppError) throw error; }
    }
    url.pathname = paths[kind];
    if (token !== undefined) {
      if (!/^[a-f0-9]{64}$/.test(token)) throw unavailable();
      // Fragments are not included in HTTP requests, access logs, or referrer headers.
      url.hash = new URLSearchParams({ token }).toString();
    }
    return url;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw unavailable();
  }
}
