/**
 * ARCHIVO: NotificationBridge.web.tsx
 * UBICACIÓN: mobile/src/components/notifications/NotificationBridge.web.tsx
 * FUNCIÓN: Observa cambios de notificaciones en navegador usando visibilidad de pestaña.
 * RESPONSABILIDAD: Mantener datos de notificaciones al día sin consultar cuando la página está oculta.
 * CONEXIONES: Importa: mobile/src/hooks/useAuth.ts, mobile/src/services/notification-events.ts, mobile/src/utils/personal-route-access.ts, mobile/src/services/notification-path.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Consulta al estar visible y cada 30 segundos; compara resumen y publica evento local si cambia, deteniendo intervalos al ocultarse.
 * IMPORTANCIA: Reduce consultas en segundo plano y sincroniza al regresar a la pestaña.
 */
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { publishNotificationChange } from '../../services/notification-events';
import { canAccessNotificationCenter } from '../../utils/personal-route-access';
import { notificationCenterPath } from '../../services/notification-path';

/** Conecta visibilidad de documento, request autenticado y eventos locales de refresco. */
export function NotificationBridge() {
  const { user, request } = useAuth();
  const enabled=canAccessNotificationCenter(user?.role??'');
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let requestInProgress = false;
    let previousSnapshot: string | null = null;
    // Consulta solo una pestaña visible y evita solicitudes concurrentes.
const poll = async () => {
      if (!active || document.visibilityState !== 'visible' || requestInProgress) return;
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
        // Keep the last backend-confirmed state and retry on the next interval or focus.
      } finally {
        requestInProgress = false;
      }
    };
    // Cancela el intervalo para no consultar mientras la pestaña está oculta.
const stopPolling = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
    };
    // Ejecuta actualización inmediata y programa consultas periódicas.
const startPolling = () => {
      stopPolling();
      void poll();
      interval = setInterval(() => void poll(), 30_000);
    };
    // Reanuda consultas al mostrarse la pestaña y las detiene al ocultarse.
const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') startPolling();
      else stopPolling();
    };
    if (document.visibilityState === 'visible') startPolling();
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      active = false;
      stopPolling();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, request, user?.id]);
  return null;
}
