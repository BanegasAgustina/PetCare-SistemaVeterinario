/**
 * ARCHIVO: agenda.tsx
 * UBICACIÓN: mobile/src/app/professional/agenda.tsx
 * FUNCIÓN: Agenda de trabajo del profesional.
 * RESPONSABILIDAD: Reexporta la agenda clínica compartida bajo el segmento professional.
 * CONEXIONES: Importa: mobile/src/components/clinic/AgendaScreen.tsx Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expo Router → AgendaScreen → clinic service/API; el backend filtra según actor/permisos.
 * IMPORTANCIA: Mantiene la misma agenda operativa y el acceso limitado al ámbito profesional.
 */
/**
 * Ruta de agenda para GROOMER autenticado. Reutiliza el componente compartido exportado; este consulta /clinic. El layout presenta los accesos y backend aplica los permisos definitivos.
 */
export { AgendaScreen as default } from '../../components/clinic/AgendaScreen';
