/**
 * ARCHIVO: patient-screen-config.ts
 * UBICACIÓN: mobile/src/utils/patient-screen-config.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de patient-screen-config.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/clinic/PatientDetailScreen.tsx, mobile/src/components/clinic/PatientsScreen.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Capacidades de presentación para la pantalla compartida; la API conserva la autorización y el alcance de datos. */
// Tipo PatientPermissionCheck: define la forma o las opciones válidas de los datos usados por este módulo.
export type PatientPermissionCheck = (permission: string) => boolean;

/** Calcula controles visibles de pacientes por rol y permisos; backend vuelve a aplicar alcance y autorización. */
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
