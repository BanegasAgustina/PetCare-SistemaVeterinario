/**
 * ARCHIVO: availability-lifecycle.ts
 * UBICACIÓN: backend/src/utils/availability-lifecycle.ts
 * FUNCIÓN: Decide si un horario archivado puede reactivarse.
 * RESPONSABILIDAD: Validar relación/fecha/profesional antes de permitir volver a publicar disponibilidad.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/clinic-admin.repository.ts
 * FUNCIONAMIENTO: Recibe comprobaciones de pertenencia, vigencia y estado y devuelve código de error legible o null.
 * IMPORTANCIA: Conserva restricciones del ciclo de vida fuera del SQL de repositorio.
 */
/** Distingue los dos recursos que pueden publicarse o archivarse. */
export type AvailabilityKind = 'slot' | 'block';

/** Resultados consultados por repositorio antes de reactivar disponibilidad. */
export type ReactivationChecks = {
  kind: AvailabilityKind;
  startsAt: string;
  professionalActive: boolean;
  serviceActive?: boolean;
  hasOverlappingActiveSlot?: boolean;
  hasOverlappingActiveBlock?: boolean;
  hasNonCancelledAppointment?: boolean;
};

/** Devuelve el motivo por el que un slot archivado no se puede reactivar, si aplica. */
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
