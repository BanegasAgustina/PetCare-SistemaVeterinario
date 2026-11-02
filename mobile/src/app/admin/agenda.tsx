/**
 * ARCHIVO: agenda.tsx
 * UBICACIÓN: mobile/src/app/admin/agenda.tsx
 * FUNCIÓN: Ruta de agenda del panel administrativo.
 * RESPONSABILIDAD: Reexporta AgendaScreen; los filtros y operaciones de agenda viven en el componente compartido.
 * CONEXIONES: Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AgendaScreen → clinic/admin APIs según operación; el backend verifica permisos.
 * IMPORTANCIA: Evita duplicar interfaz de agenda entre roles que comparten la función.
 */
/**
 * Ruta de agenda para ADMIN/SUPER_ADMIN con los permisos exigidos.
 *  Reutiliza el componente compartido exportado; este consulta /admin o /clinic 
 * según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { AgendaScreen as default } from '../../components/clinic/AgendaScreen';
