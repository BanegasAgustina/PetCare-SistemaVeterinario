/**
 * ARCHIVO: record.tsx
 * UBICACIÓN: mobile/src/app/vet/record.tsx
 * FUNCIÓN: Ruta de registros/ficha clínica del paciente veterinario.
 * RESPONSABILIDAD: Reexporta la pantalla de pacientes en modo registro clínico según parámetros.
 * CONEXIONES: Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PatientsScreen → endpoints de historia clínica autorizados.
 * IMPORTANCIA: Agrupa el recorrido de ficha y registros bajo una ruta veterinaria explícita.
 */
/**
 * Ruta de creación de un registro clínico para VETERINARIAN autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { ClinicalEditor as default } from '../../components/clinic/PatientsScreen';
