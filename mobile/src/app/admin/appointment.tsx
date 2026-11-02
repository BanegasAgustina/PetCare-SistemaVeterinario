/**
 * ARCHIVO: appointment.tsx
 * UBICACIÓN: mobile/src/app/admin/appointment.tsx
 * FUNCIÓN: Ruta de detalle/gestión de turnos para administración.
 * RESPONSABILIDAD: Reexporta AppointmentScreen y expone la pantalla en el segmento admin.
 * CONEXIONES: Importa: mobile/src/components/clinic/AppointmentScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AppointmentScreen → servicios/endpoints de turnos; el backend valida cambios.
 * IMPORTANCIA: Mantiene una implementación compartida del turno y una ruta por rol.
 */
/**
 * Ruta de detalle y gestión de un turno para ADMIN/SUPER_ADMIN con 
 * los permisos exigidos. Reutiliza el componente compartido exportado; 
 * este consulta /admin o /clinic según la operación. El layout presenta los accesos 
 * y backend aplica los permisos definitivos.
 */
export { AppointmentScreen as default } from '../../components/clinic/AppointmentScreen';
