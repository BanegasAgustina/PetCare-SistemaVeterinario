/** Persistencia nativa cifrada; en web solo memoria, sin localStorage ni contraseñas. */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiError } from './api';
import type { StoredSession } from '../types/auth';

const sessionKey = 'petcare.access-session';
let webSession: StoredSession | null = null;
let pendingMutation: Promise<void> = Promise.resolve();

// Ordenar escritura/borrado evita que un login pendiente vuelva a guardar una sesión cerrada.
function mutate(operation: () => Promise<void>): Promise<void> {
  const current = pendingMutation.catch(() => undefined).then(operation).catch(() => { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); });
  pendingMutation = current;
  return current;
}
export function saveSession(session: StoredSession): Promise<void> {
  return mutate(async () => {
    if (Platform.OS === 'web') { webSession = session; return; }
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(session), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  });
}
export function clearSession(): Promise<void> {
  return mutate(async () => {
    if (Platform.OS === 'web') { webSession = null; return; }
    await SecureStore.deleteItemAsync(sessionKey);
  });
}
export async function readSession(): Promise<StoredSession | null> {
  await pendingMutation.catch(() => undefined);
  if (Platform.OS === 'web') return webSession;
  let raw: string | null;
  try { raw = await SecureStore.getItemAsync(sessionKey); }
  catch { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos recuperar tu sesión de forma segura.'); }
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as StoredSession;
    if (typeof session.accessToken !== 'string' || session.accessToken.length === 0 || session.accessToken.length > 4096 || !Number.isFinite(session.expiresAt)) throw new Error();
    return { accessToken: session.accessToken, expiresAt: session.expiresAt };
  } catch { await clearSession(); return null; }
}
