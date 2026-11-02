/**
 * ARCHIVO: patient.tsx
 * UBICACIÓN: mobile/src/app/vet/patient.tsx
 * FUNCIÓN: Ficha de paciente del veterinario.
 * RESPONSABILIDAD: Reexporta PatientScreen en la ruta vet.
 * CONEXIONES: Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PatientsScreen → backend verifica asignación y alcance.
 * IMPORTANCIA: Mantiene ficha e historial clínico compartidos bajo autorización.
 */
/**
 * Ruta de detalle de paciente para VETERINARIAN autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { PatientScreen as default } from '../../components/clinic/PatientsScreen';
