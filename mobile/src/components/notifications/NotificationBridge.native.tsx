/**
 * ARCHIVO: NotificationBridge.native.tsx
 * UBICACIÓN: mobile/src/components/notifications/NotificationBridge.native.tsx
 * FUNCIÓN: Observa cambios de notificaciones en app nativa mediante consultas periódicas.
 * RESPONSABILIDAD: Actualizar vistas y contador local cuando el resumen remoto cambia y el usuario tiene acceso.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/notification-events.ts, mobile/src/utils/personal-route-access.ts, mobile/src/services/notification-path.ts Se utiliza desde: mobile/src/components/notifications/NotificationBridge.tsx
 * FUNCIONAMIENTO: Consulta al volver la app a primer plano y cada 30 segundos; compara un resumen y publica un evento local solo cuando cambia.
 * IMPORTANCIA: Sincroniza cambios remotos mientras la app está activa sin mantener sockets.
 */
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { publishNotificationChange } from '../../services/notification-events';
import { canAccessNotificationCenter } from '../../utils/personal-route-access';
import { notificationCenterPath } from '../../services/notification-path';

/** Polls the internal notification center while a client session is active. */
/** Conecta lifecycle nativo, request autenticado y eventos locales de refresco. */
export function NotificationBridge() {
  const { user, request } = useAuth();
  const enabled=canAccessNotificationCenter(user?.role??'');
  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let requestInProgress = false;
    let previousSnapshot: string | null = null;
    // Lee un resumen remoto; no permite solicitudes solapadas ni publica cambios al desmontarse.
const poll = async () => {
      if (!active || requestInProgress) return;
      requestInProgress = true;
      try {
        const result = await request<{ items?: { id?: string; readAt?: string | null }[]; unreadCount?: number }>(
          notificationCenterPath, { method: 'POST', body: { limit: 1 } },
        );
        if (!active) return;
        const latest = result.items?.[0];
        const snapshot = `${result.unreadCount ?? 0}:${latest?.id ?? ''}:${latest?.readAt ?? ''}`;
        if (previousSnapshot !== null && snapshot !== previousSnapshot) publishNotificationChange();
        previousSnapshot = snapshot;
      } catch {
        // Keep the last backend-confirmed state when offline; focus and polling retry later.
      } finally {
        requestInProgress = false;
      }
    };
    // Detiene el temporizador cuando la app pasa a segundo plano.
const stopPolling = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
    };
    // Consulta inmediatamente y vuelve a consultar con el intervalo configurado.
const startPolling = () => {
      stopPolling();
      void poll();
      interval = setInterval(() => void poll(), 30_000);
    };
    if (AppState.currentState === 'active') startPolling();
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') startPolling();
      else stopPolling();
    });
    return () => {
      active = false;
      stopPolling();
      subscription.remove();
    };
  }, [enabled, request, user?.id]);
  return null;
}
