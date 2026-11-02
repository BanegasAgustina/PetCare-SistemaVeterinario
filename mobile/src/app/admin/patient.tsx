/**
 * ARCHIVO: patient.tsx
 * UBICACIÓN: mobile/src/app/admin/patient.tsx
 * FUNCIÓN: Ruta de ficha de paciente en la administración.
 * RESPONSABILIDAD: Reexporta PatientScreen desde la pantalla compartida de pacientes.
 * CONEXIONES: Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PatientsScreen/PatientScreen → servicios clínicos y endpoints protegidos.
 * IMPORTANCIA: Mantiene ficha y ciclo de vida comunes para roles con permiso.
 */
/**
 * Ruta de detalle de paciente para ADMIN/SUPER_ADMIN con los permisos exigidos. Reutiliza el componente compartido exportado; este consulta /admin o /clinic según la operación. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { PatientScreen as default } from '../../components/clinic/PatientsScreen';
