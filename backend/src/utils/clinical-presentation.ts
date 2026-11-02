/**
 * ARCHIVO: clinical-presentation.ts
 * UBICACIÓN: backend/src/utils/clinical-presentation.ts
 * FUNCIÓN: Proyección segura de un registro clínico para el cliente.
 * RESPONSABILIDAD: Retirar del resultado campos que solo debe ver el profesional.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic.repository.ts
 * FUNCIONAMIENTO: Copia propiedades permitidas y omite veterinarianOnlyFields antes de presentar la ficha.
 * IMPORTANCIA: Protege datos clínicos internos al responder endpoints cliente.
 */
/** Proyección explícita de un registro clínico para la cuenta del propietario. */
// Campos del registro clínico que se reservan a profesionales.
const veterinarianOnlyFields = ['internalNotes','appointmentId','reason','diagnosis','treatment'] as const;
/** Devuelve una copia del registro sin campos exclusivos del profesional. */
export function clientClinicalRecord<T extends Record<string,unknown>>(record:T):Omit<T,typeof veterinarianOnlyFields[number]> {
  const visible={...record};
  for(const field of veterinarianOnlyFields)delete visible[field];
  return visible;
}
