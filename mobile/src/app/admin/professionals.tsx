// Este archivo se encarga de lo siguiente: Pantalla o navegación del área administrativa; conecta la interfaz con las operaciones de administración.

/**
 * Ruta de profesionales para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { ProfessionalsScreen as default } from '../../components/clinic/ProfessionalsScreen';
