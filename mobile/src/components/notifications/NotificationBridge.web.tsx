import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { publishNotificationChange } from '../../services/notification-events';

export function NotificationBridge() {
  const { user, request } = useAuth();
  useEffect(() => {
    if (user?.role !== 'CLIENT') return;
    let active = true;
    let interval: ReturnType<typeof setInterval> | undefined;
    let requestInProgress = false;
    let previousSnapshot: string | null = null;
    const poll = async () => {
      if (!active || document.visibilityState !== 'visible' || requestInProgress) return;
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
        // Keep the last backend-confirmed state and retry on the next interval or focus.
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
  }, [request, user?.id, user?.role]);
  return null;
}
