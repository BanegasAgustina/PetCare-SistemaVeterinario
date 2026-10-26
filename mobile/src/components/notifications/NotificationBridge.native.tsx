import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { publishNotificationChange } from '../../services/notification-events';

/** Polls the internal notification center while a client session is active. */
export function NotificationBridge() {
  const { user, request } = useAuth();
  useEffect(() => {
    if (Platform.OS === 'web' || user?.role !== 'CLIENT') return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let requestInProgress = false;
    let previousSnapshot: string | null = null;
    const poll = async () => {
      if (!active || requestInProgress) return;
      requestInProgress = true;
      try {
        const result = await request<{ items?: { id?: string; readAt?: string | null }[]; unreadCount?: number }>(
          '/client/notifications', { method: 'POST', body: { limit: 1 } },
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
    const stopPolling = () => {
      if (interval) clearInterval(interval);
      interval = undefined;
    };
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
  }, [request, user?.id, user?.role]);
  return null;
}
