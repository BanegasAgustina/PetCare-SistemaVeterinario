/**
 * ARCHIVO: appointment.tsx
 * UBICACIÓN: mobile/src/app/vet/appointment.tsx
 * FUNCIÓN: Detalle y gestión de turnos del módulo veterinario.
 * RESPONSABILIDAD: Reexporta AppointmentScreen dentro del grupo vet.
 * CONEXIONES: Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AppointmentScreen → clinic service/API.
 * IMPORTANCIA: Comparte lectura y cambios de turnos según permisos del backend.
 */
/**
 * Ruta de detalle y gestión de un turno para VETERINARIAN autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { AppointmentScreen as default } from '../../components/clinic/AppointmentScreen';
