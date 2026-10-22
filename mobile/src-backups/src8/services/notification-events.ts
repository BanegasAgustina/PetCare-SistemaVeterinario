const listeners = new Set<() => void>();

export function subscribeToNotificationChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function publishNotificationChange(): void {
  for (const listener of listeners) listener();
}
