/** Capacidades de presentación para la pantalla compartida; la API conserva la autorización y el alcance de datos. */
export type PatientPermissionCheck = (permission: string) => boolean;

export function patientScreenConfig(role: string, hasPermission: PatientPermissionCheck) {
  const veterinarian = role === 'VETERINARIAN';
  const groomer = role === 'GROOMER';
  const secretary = role === 'SECRETARY';
  const administrator = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const lifecycleRole = veterinarian || groomer || administrator;

  return {
    veterinarian,
    groomer,
    canFilterSpecies: veterinarian || administrator,
    canEditPatient: !groomer && !secretary && hasPermission('pets.update'),
    canManagePatientLifecycle: lifecycleRole && hasPermission('pets.update') && (!groomer || hasPermission('appointments.view_own')),
    basePath: veterinarian ? '/vet' : secretary ? '/secretary' : groomer ? '/professional' : '/admin',
  } as const;
}
