// Este archivo se encarga de lo siguiente: Servicio de la app móvil; agrupa comunicación con la API o manejo de sesión y eventos.

/** SecureStore nativo y sessionStorage por pestaña web; nunca guarda contraseñas. */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiError } from './api';
import type { StoredSession } from '../types/auth';
import { clearWebSession, readWebSession, saveWebSession } from './web-session-store';

// Dato sessionKey: conserva un valor calculado o de configuración usado por este módulo.
const sessionKey = 'petcare.access-session';
// Dato pendingMutation: conserva un valor calculado o de configuración usado por este módulo.
let pendingMutation: Promise<void> = Promise.resolve();

// Ordenar escritura/borrado evita que un login pendiente vuelva a guardar una sesión cerrada.
// Función mutate: concentra la lógica dentro de este módulo.
function mutate(operation: () => Promise<void>): Promise<void> {
  const current = pendingMutation.catch(() => undefined).then(operation).catch(() => { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); });
  pendingMutation = current;
  return current;
}
// Función saveSession: actualiza o guarda información dentro de este módulo.
export function saveSession(session: StoredSession): Promise<void> {
  return mutate(async () => {
    if (Platform.OS === 'web') { saveWebSession(session); return; }
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(session), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  });
}
// Función clearSession: concentra la lógica dentro de este módulo.
export function clearSession(): Promise<void> {
  return mutate(async () => {
    if (Platform.OS === 'web') { clearWebSession(); return; }
    await SecureStore.deleteItemAsync(sessionKey);
  });
}
// Función readSession: obtiene o consulta información dentro de este módulo.
export async function readSession(): Promise<StoredSession | null> {
  await pendingMutation.catch(() => undefined);
  if (Platform.OS === 'web') return readWebSession();
  let raw: string | null;
  try { raw = await SecureStore.getItemAsync(sessionKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos recuperar tu sesión de forma segura.'); }
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    if (typeof session.accessToken !== 'string' || session.accessToken.length === 0 || session.accessToken.length > 4096 || !Number.isFinite(session.expiresAt)) throw new Error();
    if (session.refreshToken !== undefined && (typeof session.refreshToken !== 'string' || !/^[a-f0-9]{64}$/.test(session.refreshToken))) throw new Error();
    return { accessToken: session.accessToken, expiresAt: session.expiresAt, ...(session.refreshToken ? {refreshToken:session.refreshToken} : {}) };
  } catch { await clearSession(); return null; }
}
