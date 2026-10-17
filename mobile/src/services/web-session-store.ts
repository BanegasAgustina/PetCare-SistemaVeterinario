/** Sesión web limitada a la pestaña actual y persistente entre recargas. */
import { ApiError } from './api';
import type { StoredSession } from '../types/auth';

const sessionKey = 'petcare.access-session';

export function saveWebSession(session: StoredSession): void {
  try { window.sessionStorage.setItem(sessionKey, JSON.stringify(session)); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); }
}

export function clearWebSession(): void {
  try { window.sessionStorage.removeItem(sessionKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); }
}

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
