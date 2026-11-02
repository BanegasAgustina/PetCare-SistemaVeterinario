/**
 * ARCHIVO: professionals.tsx
 * UBICACIÓN: mobile/src/app/admin/professionals.tsx
 * FUNCIÓN: Ruta de listado operativo de profesionales.
 * RESPONSABILIDAD: Reexporta ProfessionalsScreen desde la interfaz de clínica compartida.
 * CONEXIONES: Importa: mobile/src/components/clinic/ProfessionalsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → ProfessionalsScreen → clinic service/endpoints protegidos.
 * IMPORTANCIA: Permite gestionar profesionales sin repetir controles y tabla.
 */
/**
 * Ruta de profesionales para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { ProfessionalsScreen as default } from '../../components/clinic/ProfessionalsScreen';
