/**
 * ARCHIVO: patients.tsx
 * UBICACIÓN: mobile/src/app/vet/patients.tsx
 * FUNCIÓN: Listado de pacientes del veterinario.
 * RESPONSABILIDAD: Reexporta PatientsScreen como listado.
 * CONEXIONES: Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PatientsScreen → servicios y consultas clínicas protegidas.
 * IMPORTANCIA: Provee búsqueda con un componente común y acceso limitado por servidor.
 */
/**
 * Ruta de pacientes para VETERINARIAN autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { PatientsScreen as default } from '../../components/clinic/PatientsScreen';
