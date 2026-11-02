/**
 * ARCHIVO: patients.tsx
 * UBICACIÓN: mobile/src/app/professional/patients.tsx
 * FUNCIÓN: Listado de pacientes del profesional.
 * RESPONSABILIDAD: Reexporta PatientsScreen como ruta de listado.
 * CONEXIONES: Importa: mobile/src/components/clinic/PatientsScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → PatientsScreen → búsquedas clínicas protegidas por backend.
 * IMPORTANCIA: Comparte búsqueda y presentación sin duplicar lógica por rol.
 */
/** Listado de pacientes para GROOMER con permiso de consulta. */
export { PatientsScreen as default } from '../../components/clinic/PatientsScreen';
