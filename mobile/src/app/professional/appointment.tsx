/**
 * ARCHIVO: appointment.tsx
 * UBICACIÓN: mobile/src/app/professional/appointment.tsx
 * FUNCIÓN: Detalle y operación de turnos del espacio profesional.
 * RESPONSABILIDAD: Reexporta AppointmentScreen compartida para esta ruta.
 * CONEXIONES: Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AppointmentScreen → turnos y clinic API.
 * IMPORTANCIA: Comparte el flujo de consulta/cambio de turno con otros roles autorizados.
 */
/**
 * Ruta de detalle y gestión de un turno para GROOMER autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { AppointmentScreen as default } from '../../components/clinic/AppointmentScreen';
