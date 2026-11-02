/**
 * ARCHIVO: web-session-store.ts
 * UBICACIÓN: mobile/src/services/web-session-store.ts
 * FUNCIÓN: Guarda la sesión y la prueba temporal de OAuth de la versión web en sessionStorage.
 * RESPONSABILIDAD: Mantener los datos autenticados limitados a la pestaña actual y validar su forma al recuperarlos.
 * CONEXIONES: Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/services/oauth.service.ts, mobile/src/services/session-store.ts
 * FUNCIONAMIENTO: Serializa valores JSON, traduce fallos del navegador a ApiError y descarta sesiones o pruebas inválidas/vencidas.
 * IMPORTANCIA: Implementa el almacenamiento web consumido por session-store y oauth.service sin persistencia entre ventanas independientes.
 */
/** Sesión web limitada a la pestaña actual y persistente entre recargas. */
import { ApiError } from './api';
import type { StoredSession } from '../types/auth';

/** Clave de la sesión web, compartida con session-store. */
const sessionKey = 'petcare.access-session';
/** Clave de la prueba temporal que vincula el retorno OAuth con la pestaña que lo inició. */
const oauthProofKey = 'petcare.oauth-proof';

/** Guarda la sesión actual en sessionStorage y traduce fallos de acceso al almacenamiento. */
export function saveWebSession(session: StoredSession): void {
  try { window.sessionStorage.setItem(sessionKey, JSON.stringify(session)); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); }
}

/** Elimina la sesión web de la pestaña actual. */
export function clearWebSession(): void {
  try { window.sessionStorage.removeItem(sessionKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); }
}

/** Guarda una prueba OAuth junto con su hora para poder aplicar expiración local. */
export function saveWebOAuthProof(proof: string): void {
  try { window.sessionStorage.setItem(oauthProofKey, JSON.stringify({ proof, createdAt: Date.now() })); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos continuar el inicio de sesión de forma segura. Intentá nuevamente.'); }
}

/** Indica si existe una prueba OAuth que siga siendo válida. */
export function hasWebOAuthProof(): boolean {
  return readWebOAuthProof() !== null;
}

/** Lee, valida formato y antigüedad; limpia del almacenamiento una prueba inválida o vencida. */
export function readWebOAuthProof(): string | null {
  try {
    const raw = window.sessionStorage.getItem(oauthProofKey);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object' || !('proof' in value) || typeof value.proof !== 'string' ||
      !/^[a-f0-9]{64}$/.test(value.proof) || !('createdAt' in value) || typeof value.createdAt !== 'number' ||
      !Number.isFinite(value.createdAt) || Date.now() - value.createdAt > 10 * 60 * 1000) {
      window.sessionStorage.removeItem(oauthProofKey);
      return null;
    }
    return value.proof;
  } catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos recuperar el inicio de sesión pendiente.'); }
}

/** Elimina la prueba temporal al terminar o abandonar el flujo web de OAuth. */
export function clearWebOAuthProof(): void {
  try { window.sessionStorage.removeItem(oauthProofKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos limpiar el inicio de sesión pendiente.'); }
}

/** Recupera y valida la sesión web; una entrada corrupta se elimina y se trata como sesión ausente. */
export function readWebSession(): StoredSession | null {
  let raw: string | null;
  try { raw = window.sessionStorage.getItem(sessionKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos recuperar tu sesión de forma segura.'); }
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    if (typeof session.accessToken !== 'string' || session.accessToken.length === 0 || session.accessToken.length > 4096 || !Number.isFinite(session.expiresAt)) throw new Error();
    if (session.refreshToken !== undefined && (typeof session.refreshToken !== 'string' || !/^[a-f0-9]{64}$/.test(session.refreshToken))) throw new Error();
    return { accessToken: session.accessToken, expiresAt: session.expiresAt, ...(session.refreshToken ? { refreshToken: session.refreshToken } : {}) };
  } catch {
    clearWebSession();
    return null;
  }
}
