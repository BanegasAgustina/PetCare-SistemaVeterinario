/**
 * ARCHIVO: NotificationBridge.tsx
 * UBICACIÓN: mobile/src/components/notifications/NotificationBridge.tsx
 * FUNCIÓN: Entrada común que permite seleccionar la implementación de notificaciones por plataforma.
 * RESPONSABILIDAD: Exponer un único import para que el layout raíz monte el puente adecuado.
 * CONEXIONES: Importa: mobile/src/components/notifications/NotificationBridge.native.tsx Se utiliza desde: mobile/src/app/_layout.tsx
 * FUNCIONAMIENTO: Reexporta el puente nativo; la resolución de plataforma puede preferir el archivo .web.tsx en navegador.
 * IMPORTANCIA: Aísla diferencias de lifecycle web/nativo del layout raíz.
 */
export { NotificationBridge } from './NotificationBridge.native';
