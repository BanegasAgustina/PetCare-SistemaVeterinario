// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

// Tipo AgendaPermissionCheck: define la forma o las opciones válidas de los datos usados por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Tipo AgendaPermissionCheck: define la forma o las opciones válidas de datos usados por este módulo.
export type AgendaPermissionCheck = (permission: string) => boolean;

/** Agenda presentation follows effective scope; the role only selects the route used for details. */
// Función agendaScreenConfig: concentra la lógica dentro de este módulo.
export function agendaScreenConfig(role: string, hasPermission: AgendaPermissionCheck) {
  return {
    personalAgenda: hasPermission('appointments.view_own') && !hasPermission('appointments.view_all'),
    canSearchOwner: hasPermission('users.view_basic'),
    title: role === 'GROOMER' ? 'Mi agenda' : 'Agenda y turnos',
    basePath: role === 'VETERINARIAN' ? '/vet' : role === 'GROOMER' ? '/professional' : '/admin',
  };
}
