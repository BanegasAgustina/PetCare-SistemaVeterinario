/**
 * ARCHIVO: session-store.ts
 * UBICACIÓN: mobile/src/services/session-store.ts
 * FUNCIÓN: Persiste y recupera sesiones con SecureStore nativo o sessionStorage en web.
 * RESPONSABILIDAD: Proveer almacenamiento de tokens de acceso y renovación sin guardar contraseñas.
 * CONEXIONES: Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts, mobile/src/services/web-session-store.ts Se utiliza desde: mobile/src/contexts/AuthContext.tsx
 * FUNCIONAMIENTO: Serializa escrituras y borrados, elige el almacenamiento según Platform.OS y valida la sesión al leerla.
 * IMPORTANCIA: Es el límite de persistencia usado por AuthContext para restaurar o cerrar sesión de forma segura.
 */
/** SecureStore nativo y sessionStorage por pestaña web; nunca guarda contraseñas. */
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ApiError } from './api';
import type { StoredSession } from '../types/auth';
import { clearWebSession, readWebSession, saveWebSession } from './web-session-store';

/** Clave compartida con la implementación web para mantener el mismo contrato. */
const sessionKey = 'petcare.access-session';
/** Cola de mutaciones para que un guardado anterior no compita con un cierre posterior. */
let pendingMutation: Promise<void> = Promise.resolve();

// Ordenar escritura/borrado evita que un login pendiente vuelva a guardar una sesión cerrada.
/** Ejecuta escrituras en orden y traduce fallos del almacenamiento a un error público. */
function mutate(operation: () => Promise<void>): Promise<void> {
  const current = pendingMutation.catch(() => undefined).then(operation).catch(() => { throw new ApiError('SESSION_STORAGE_ERROR', 'No pudimos actualizar tu sesión de forma segura. Intentá nuevamente.'); });
  pendingMutation = current;
  return current;
}
/** Guarda la sesión en el almacén adecuado para la plataforma actual. */
export function saveSession(session: StoredSession): Promise<void> {
  return mutate(async () => {
    if (Platform.OS === 'web') { saveWebSession(session); return; }
    await SecureStore.setItemAsync(sessionKey, JSON.stringify(session), { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  });
}
/** Borra la sesión usando la misma cola que saveSession para respetar el orden. */
export function clearSession(): Promise<void> {
  return mutate(async () => {
    if (Platform.OS === 'web') { clearWebSession(); return; }
    await SecureStore.deleteItemAsync(sessionKey);
  });
}
/** Espera escrituras pendientes, valida el contenido persistido y elimina datos corruptos. */
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
