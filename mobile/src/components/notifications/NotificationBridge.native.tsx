// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { publishNotificationChange } from '../../services/notification-events';
import { canAccessNotificationCenter } from '../../utils/personal-route-access';
import { notificationCenterPath } from '../../services/notification-path';

/** Polls the internal notification center while a client session is active. */
// Función NotificationBridge: concentra la lógica dentro de este módulo.
export function NotificationBridge() {
  const { user, request } = useAuth();
  const enabled=canAccessNotificationCenter(user?.role??'');
  useEffect(() => {
    if (Platform.OS === 'web' || !enabled) return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let requestInProgress = false;
    let previousSnapshot: string | null = null;
    // Función poll: agrupa una operación que este módulo puede ejecutar o reutilizar.
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
