/**
 * ARCHIVO: agenda.tsx
 * UBICACIÓN: mobile/src/app/vet/agenda.tsx
 * FUNCIÓN: Agenda del módulo veterinario.
 * RESPONSABILIDAD: Reexporta AgendaScreen para el grupo de rutas vet.
 * CONEXIONES: Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AgendaScreen → servicios/endpoints de agenda.
 * IMPORTANCIA: Conserva interfaz compartida con límites de acceso de veterinario.
 */
/**
 * Ruta de agenda para VETERINARIAN autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { AgendaScreen as default } from '../../components/clinic/AgendaScreen';
