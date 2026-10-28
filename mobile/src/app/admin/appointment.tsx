// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

/**
 * Ruta de detalle y gestión de un turno para ADMIN/SUPER_ADMIN con 
 * los permisos exigidos. Reutiliza el componente compartido exportado; 
 * este consulta /admin o /clinic según la operación. El layout presenta los accesos 
 * y backend aplica los permisos definitivos.
 */
export { AppointmentScreen as default } from '../../components/clinic/AppointmentScreen';
