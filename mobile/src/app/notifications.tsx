/**
 * ARCHIVO: notifications.tsx
 * UBICACIÓN: mobile/src/app/notifications.tsx
 * FUNCIÓN: Alias de ruta para la bandeja de notificaciones compartida.
 * RESPONSABILIDAD: Reexporta la pantalla de notificaciones cliente que adapta la vista al usuario autenticado.
 * CONEXIONES: Importa: mobile/src/app/client/notifications.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → esta ruta → client/notifications.tsx → client.service/backend.
 * IMPORTANCIA: Evita duplicar la bandeja al entrar desde distintos destinos autenticados.
 */
/** Alias a la bandeja de notificaciones compartida para los roles autenticados. */
export { default } from './client/notifications';
