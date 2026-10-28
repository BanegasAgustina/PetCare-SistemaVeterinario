// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Proyección explícita de un registro clínico para la cuenta del propietario. */
// Dato veterinarianOnlyFields: conserva un valor calculado o de configuración usado por este módulo.
const veterinarianOnlyFields = ['internalNotes','appointmentId','reason','diagnosis','treatment'] as const;
// Función clientClinicalRecord: concentra la lógica dentro de este módulo.
export function clientClinicalRecord<T extends Record<string,unknown>>(record:T):Omit<T,typeof veterinarianOnlyFields[number]> {
  const visible={...record};
  for(const field of veterinarianOnlyFields)delete visible[field];
  return visible;
}
