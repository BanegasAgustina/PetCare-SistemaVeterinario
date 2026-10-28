// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Capacidades de presentación para la pantalla compartida; la API conserva la autorización y el alcance de datos. */
// Tipo PatientPermissionCheck: define la forma o las opciones válidas de los datos usados por este módulo.
export type PatientPermissionCheck = (permission: string) => boolean;

// Función patientScreenConfig: concentra la lógica dentro de este módulo.
export function patientScreenConfig(role: string, hasPermission: PatientPermissionCheck) {
  const veterinarian = role === 'VETERINARIAN';
  const groomer = role === 'GROOMER';
  const administrator = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const lifecycleRole = veterinarian || groomer || administrator;

  return {
    veterinarian,
    groomer,
    canFilterSpecies: veterinarian || administrator,
    canEditPatient: !groomer && hasPermission('pets.update'),
    canManagePatientLifecycle: lifecycleRole && hasPermission('pets.update') && (!groomer || hasPermission('appointments.view_own')),
    basePath: veterinarian ? '/vet' : groomer ? '/professional' : '/admin',
  } as const;
}
