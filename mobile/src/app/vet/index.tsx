/**
 * ARCHIVO: index.tsx
 * UBICACIÓN: mobile/src/app/vet/index.tsx
 * FUNCIÓN: Inicio del espacio veterinario.
 * RESPONSABILIDAD: Reexporta StaffHome como tablero de trabajo del veterinario.
 * CONEXIONES: Importa: mobile/src/components/clinic/StaffHome.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → StaffHome → datos de clínica y accesos por rol.
 * IMPORTANCIA: Ofrece la entrada común a agenda y módulos habilitados.
 */
/**
 * Ruta de inicio del panel para VETERINARIAN autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { StaffHome as default } from '../../components/clinic/StaffHome';
