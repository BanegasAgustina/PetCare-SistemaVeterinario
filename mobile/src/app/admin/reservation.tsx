/**
 * Ruta de detalle de reserva para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { ReservationScreen as default } from '../../components/clinic/ReservationsScreen';
