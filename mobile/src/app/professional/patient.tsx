/**
 * ARCHIVO: patient.tsx
 * UBICACIÓN: mobile/src/app/professional/patient.tsx
 * FUNCIÓN: Ficha de paciente en el espacio profesional.
 * RESPONSABILIDAD: Reexporta la vista de pacientes compartida.
 * CONEXIONES: Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PatientsScreen → servicio clínico; el backend determina el alcance.
 * IMPORTANCIA: Permite abrir paciente manteniendo una sola implementación de ficha.
 */
/** Ficha clínica accesible desde pacientes para GROOMER con permiso de consulta. */
export { PatientScreen as default } from '../../components/clinic/PatientsScreen';
