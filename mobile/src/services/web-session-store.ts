// Este archivo se encarga de lo siguiente: Servicio de la app móvil; agrupa comunicación con la API o manejo de sesión y eventos.

/** Sesión web limitada a la pestaña actual y persistente entre recargas. */
import { ApiError } from './api';
import type { StoredSession } from '../types/auth';

// Dato sessionKey: conserva un valor calculado o de configuración usado por este módulo.
const sessionKey = 'petcare.access-session';
// Dato oauthProofKey: conserva un valor calculado o de configuración usado por este módulo.
const oauthProofKey = 'petcare.oauth-proof';

// Función saveWebSession: actualiza o guarda información dentro de este módulo.
export function saveWebSession(session: StoredSession): void {
  try { window.sessionStorage.setItem(sessionKey, JSON.stringify(session)); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); }
}

// Función clearWebSession: concentra la lógica dentro de este módulo.
export function clearWebSession(): void {
  try { window.sessionStorage.removeItem(sessionKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); }
}

// Función saveWebOAuthProof: actualiza o guarda información dentro de este módulo.
export function saveWebOAuthProof(proof: string): void {
  try { window.sessionStorage.setItem(oauthProofKey, JSON.stringify({ proof, createdAt: Date.now() })); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos continuar el inicio de sesión de forma segura. Intentá nuevamente.'); }
}

// Función hasWebOAuthProof: comprueba una regla o condición dentro de este módulo.
export function hasWebOAuthProof(): boolean {
  return readWebOAuthProof() !== null;
}

// Función readWebOAuthProof: obtiene o consulta información dentro de este módulo.
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

// Función clearWebOAuthProof: concentra la lógica dentro de este módulo.
export function clearWebOAuthProof(): void {
  try { window.sessionStorage.removeItem(oauthProofKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos limpiar el inicio de sesión pendiente.'); }
}

// Función readWebSession: obtiene o consulta información dentro de este módulo.
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
