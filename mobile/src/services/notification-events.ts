/**
 * ARCHIVO: notification-events.ts
 * UBICACIÓN: mobile/src/services/notification-events.ts
 * FUNCIÓN: Mantiene un canal local de avisos para refrescar vistas cuando cambia una notificación.
 * RESPONSABILIDAD: Suscribir y notificar componentes montados en la app, sin realizar llamadas de red.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/client/notifications.tsx, mobile/src/components/layout/GlobalNavigation.tsx, mobile/src/components/notifications/NotificationBridge.native.tsx, mobile/src/components/notifications/NotificationBridge.web.tsx
 * FUNCIONAMIENTO: Conserva callbacks en un Set; publicar recorre los callbacks y cada suscripción obtiene una función para retirarse.
 * IMPORTANCIA: Permite que navegación, puente de notificaciones y bandeja mantengan contadores/listas sincronizados dentro de la misma instancia de app.
 */
/** Callbacks activos; el Set evita registrar dos veces la misma referencia. */
const listeners = new Set<() => void>();

/** Registra un callback y devuelve la limpieza que deben ejecutar los consumidores al desmontarse. */
export function subscribeToNotificationChanges(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Notifica sin argumentos a los consumidores para que vuelvan a consultar su estado. */
export function publishNotificationChange(): void {
  for (const listener of listeners) listener();
}
