/**
 * ARCHIVO: patients.tsx
 * UBICACIÓN: mobile/src/app/admin/patients.tsx
 * FUNCIÓN: Ruta de listado de pacientes para el panel administrativo.
 * RESPONSABILIDAD: Reexporta PatientsScreen en modo listado.
 * CONEXIONES: Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PatientsScreen → búsquedas/servicios clínicos → backend limita alcance.
 * IMPORTANCIA: Presenta pacientes con una implementación compartida y datos autorizados por servidor.
 */
/**
 * Ruta de pacientes para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { PatientsScreen as default } from '../../components/clinic/PatientsScreen';
