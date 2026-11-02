/**
 * ARCHIVO: index.tsx
 * UBICACIÓN: mobile/src/app/professional/index.tsx
 * FUNCIÓN: Inicio del espacio profesional.
 * RESPONSABILIDAD: Reexporta StaffHome para métricas, agenda y accesos del profesional.
 * CONEXIONES: Importa: mobile/src/components/clinic/StaffHome.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → StaffHome → hooks/servicios de clínica.
 * IMPORTANCIA: Centraliza la vista inicial de trabajo profesional.
 */
/**
 * Ruta de inicio del panel para GROOMER autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { StaffHome as default } from '../../components/clinic/StaffHome';
