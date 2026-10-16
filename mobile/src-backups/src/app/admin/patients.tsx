/**
 * Ruta de pacientes para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { PatientsScreen as default } from '../../components/clinic/PatientsScreen';
