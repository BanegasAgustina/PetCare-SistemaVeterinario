// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

// Dato listeners: conserva un valor calculado o de configuración usado por este módulo.
// Propósito: Servicio de la app móvil; agrupa comunicación con la API o manejo de sesión y eventos.

// Dato listeners: conserva un valor calculado o de configuración usado por este módulo.
const listeners = new Set<() => void>();

// Función subscribeToNotificationChanges: concentra la lógica dentro de este módulo.
export function subscribeToNotificationChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Función publishNotificationChange: concentra la lógica dentro de este módulo.
export function publishNotificationChange(): void {
  for (const listener of listeners) listener();
}
