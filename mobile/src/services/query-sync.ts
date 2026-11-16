/** Adaptador de la sincronización de consultas al lifecycle de web y Android/iOS. */
import { AppState, Platform } from 'react-native';
import { QuerySyncCoordinator, type LiveRefresh } from './query-sync-core';

const coordinator = new QuerySyncCoordinator();
let timer: ReturnType<typeof setInterval> | undefined;
let appSubscription: ReturnType<typeof AppState.addEventListener> | undefined;
let subscriberCount = 0;
let webListenersAttached = false;

function platformIsActive(): boolean {
  if (Platform.OS === 'web') {
    const visible = typeof document === 'undefined' || document.visibilityState === 'visible';
    const online = typeof navigator === 'undefined' || navigator.onLine !== false;
    return visible && online;
  }
  return AppState.currentState === 'active';
}

function updatePlatformState(): void { coordinator.setActive(platformIsActive()); }

function attachLifecycle(): void {
  if (timer) return;
  timer = setInterval(() => coordinator.tick(), 1_000);
  if (Platform.OS === 'web') {
    if (!webListenersAttached && typeof document !== 'undefined' && typeof window !== 'undefined') {
      document.addEventListener('visibilitychange', updatePlatformState);
      window.addEventListener('online', updatePlatformState);
      window.addEventListener('offline', updatePlatformState);
      webListenersAttached = true;
    }
  } else if (!appSubscription) {
    appSubscription = AppState.addEventListener('change', updatePlatformState);
  }
  coordinator.setActive(platformIsActive());
}

function detachLifecycle(): void {
  if (timer) clearInterval(timer);
  timer = undefined;
  if (webListenersAttached && typeof document !== 'undefined' && typeof window !== 'undefined') {
    document.removeEventListener('visibilitychange', updatePlatformState);
    window.removeEventListener('online', updatePlatformState);
    window.removeEventListener('offline', updatePlatformState);
    webListenersAttached = false;
  }
  appSubscription?.remove();
  appSubscription = undefined;
}

/** Suscribe una consulta únicamente mientras su pantalla está enfocada. */
export function subscribeLiveQuery(refresh: LiveRefresh, intervalMs = 30_000): () => void {
  subscriberCount += 1;
  attachLifecycle();
  const unsubscribe = coordinator.subscribe(refresh, intervalMs);
  return () => {
    unsubscribe();
    subscriberCount = Math.max(0, subscriberCount - 1);
    if (!subscriberCount) detachLifecycle();
  };
}

/** Refresca las pantallas visibles después de una escritura realizada en esta sesión. */
export function publishLocalDataChange(): void { coordinator.invalidateAll(); }
