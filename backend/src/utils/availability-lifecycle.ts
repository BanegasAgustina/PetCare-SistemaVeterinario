// Este archivo se encarga de validar si un horario o bloqueo puede reactivarse sin generar conflictos.

// Tipo AvailabilityKind: define la forma o las opciones válidas de datos usados por este módulo.
export type AvailabilityKind = 'slot' | 'block';

// Tipo ReactivationChecks: define la forma o las opciones válidas de datos usados por este módulo.
export type ReactivationChecks = {
  kind: AvailabilityKind;
  startsAt: string;
  professionalActive: boolean;
  serviceActive?: boolean;
  hasOverlappingActiveSlot?: boolean;
  hasOverlappingActiveBlock?: boolean;
  hasNonCancelledAppointment?: boolean;
};

/** Validaciones puras para reactivar disponibilidad sin ofrecer horarios inválidos. */
// Función availabilityReactivationError: concentra la lógica dentro de este módulo.
export function availabilityReactivationError(checks: ReactivationChecks, now = new Date()): string | null {
  const startsAt = new Date(`${checks.startsAt.replace(' ', 'T')}Z`);
  if (Number.isNaN(startsAt.getTime()) || startsAt <= now) return 'No se puede reactivar un horario que ya comenzó.';
  if (!checks.professionalActive) return 'El profesional está inactivo. Activá su cuenta antes de reactivar la disponibilidad.';

  if (checks.kind === 'slot') {
    if (!checks.serviceActive) return 'El servicio está inactivo. Reactivalo antes de ofrecer este horario.';
    if (checks.hasOverlappingActiveSlot) return 'Ya existe otro horario activo que se superpone con este intervalo.';
    if (checks.hasOverlappingActiveBlock) return 'El profesional tiene un bloqueo activo en este intervalo.';
    if (checks.hasNonCancelledAppointment) return 'El horario conserva un turno histórico o vigente y no puede volver a ofrecerse.';
  } else {
    if (checks.hasOverlappingActiveBlock) return 'Ya existe un bloqueo activo que se superpone con este intervalo.';
    if (checks.hasNonCancelledAppointment) return 'Hay un turno vigente en este intervalo. Reprogramalo o cancelalo antes de reactivar el bloqueo.';
  }
  return null;
}
