/** Proyección explícita de un registro clínico para la cuenta del propietario. */
const veterinarianOnlyFields = ['internalNotes','appointmentId','reason','diagnosis','treatment'] as const;
export function clientClinicalRecord<T extends Record<string,unknown>>(record:T):Omit<T,typeof veterinarianOnlyFields[number]> {
  const visible={...record};
  for(const field of veterinarianOnlyFields)delete visible[field];
  return visible;
}
