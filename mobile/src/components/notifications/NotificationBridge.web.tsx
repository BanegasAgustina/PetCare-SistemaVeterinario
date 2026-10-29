// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { publishNotificationChange } from '../../services/notification-events';
import { canAccessNotificationCenter } from '../../utils/personal-route-access';
import { notificationCenterPath } from '../../services/notification-path';

// Función NotificationBridge: concentra la lógica dentro de este módulo.
export function NotificationBridge() {
  const { user, request } = useAuth();
  const enabled=canAccessNotificationCenter(user?.role??'');
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let requestInProgress = false;
    let previousSnapshot: string | null = null;
    // Función poll: agrupa una operación que este módulo puede ejecutar o reutilizar.
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
    // Función stopPolling: agrupa una operación que este módulo puede ejecutar o reutilizar.
const stopPolling = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
    };
    // Función startPolling: agrupa una operación que este módulo puede ejecutar o reutilizar.
const startPolling = () => {
      stopPolling();
      void poll();
      interval = setInterval(() => void poll(), 30_000);
    };
    // Función onVisibilityChange: agrupa una operación que este módulo puede ejecutar o reutilizar.
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
