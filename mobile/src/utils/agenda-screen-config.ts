export type AgendaPermissionCheck = (permission: string) => boolean;

/** Agenda presentation follows effective scope; the role only selects the route used for details. */
export function agendaScreenConfig(role: string, hasPermission: AgendaPermissionCheck) {
  return {
    personalAgenda: hasPermission('appointments.view_own') && !hasPermission('appointments.view_all'),
    canSearchOwner: hasPermission('users.view_basic'),
    title: role === 'GROOMER' ? 'Mi agenda' : 'Agenda y turnos',
    basePath: role === 'VETERINARIAN' ? '/vet' : role === 'GROOMER' ? '/professional' : role === 'SECRETARY' ? '/secretary' : '/admin',
  };
}
