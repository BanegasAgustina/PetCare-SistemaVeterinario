/**
 * ARCHIVO: agenda-screen-config.ts
 * UBICACIÓN: mobile/src/utils/agenda-screen-config.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de agenda-screen-config.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/clinic/AgendaScreen.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
// Tipo AgendaPermissionCheck: define la forma o las opciones válidas de los datos usados por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Tipo AgendaPermissionCheck: define la forma o las opciones válidas de datos usados por este módulo.
export type AgendaPermissionCheck = (permission: string) => boolean;

/** Calcula alcance personal, búsqueda de responsable, título y ruta base a partir del rol y permisos efectivos. */
/** Deriva título, ruta base y capacidades de la agenda a partir del rol y grants efectivos recibidos. */
export function agendaScreenConfig(role: string, hasPermission: AgendaPermissionCheck) {
  return {
    personalAgenda: hasPermission('appointments.view_own') && !hasPermission('appointments.view_all'),
    canSearchOwner: hasPermission('users.view_basic'),
    title: role === 'GROOMER' ? 'Mi agenda' : 'Agenda y turnos',
    basePath: role === 'VETERINARIAN' ? '/vet' : role === 'GROOMER' ? '/professional' : '/admin',
  };
}
