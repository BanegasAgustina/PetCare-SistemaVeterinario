/**
 * ARCHIVO: pet-lifecycle.ts
 * UBICACIÓN: backend/src/utils/pet-lifecycle.ts
 * FUNCIÓN: Reglas de estado, desactivación y reactivación de mascotas/pacientes.
 * RESPONSABILIDAD: Validar dato de activo, permisos, motivos, turnos futuros y transiciones del paciente.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts, backend/src/types/auth.ts Se utiliza desde: backend/src/repositories/client.repository.ts, backend/src/repositories/clinic.repository.ts
 * FUNCIONAMIENTO: Normaliza booleanos, arroja errores de dominio y prepara texto de notificación del cambio.
 * IMPORTANCIA: Mantiene el ciclo de vida consistente en repositorios de cliente y clínica.
 */
import { AppError } from './app-error';
import type { AuthUser } from '../types/auth';

// Roles profesionales/admin que pueden gestionar ciclo de vida de pacientes.
const patientLifecycleRoles = new Set(['ADMIN','SUPER_ADMIN','VETERINARIAN','GROOMER']);

/** Normalize MySQL/API boolean representations without relying on JavaScript truthiness. */
/** Acepta representaciones válidas de activo/inactivo y devuelve null si no se reconoce. */
export function normalizePetActiveFlag(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number' || typeof value === 'bigint') {
    if (value === 1 || value === 1n) return true;
    if (value === 0 || value === 0n) return false;
    return null;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['1','true','active','activo'].includes(normalized)) return true;
    if (['0','false','inactive','inactivo'].includes(normalized)) return false;
    return null;
  }
  if (Buffer.isBuffer(value) && value.length === 1) {
    if (value[0] === 1) return true;
    if (value[0] === 0) return false;
  }
  return null;
}

/** Stored pets.is_active is NOT NULL; fail visibly if schema/API data violates that contract. */
/** Convierte una entrada en estado booleano o lanza error si está mal formada. */
export function requirePetActiveFlag(value: unknown): boolean {
  const normalized = normalizePetActiveFlag(value);
  if (normalized === null) throw new AppError('INVALID_PET_STATE', 500, 'El estado persistido de la mascota no es válido.');
  return normalized;
}

/** Future appointments are a deactivation guard only; they never determine the pet's active flag. */
/** Bloquea desactivar paciente si conserva turnos futuros pendientes. */
export function assertNoFuturePatientAppointments(statuses: readonly unknown[]): void {
  if (statuses.length) throw new AppError('PET_HAS_APPOINTMENTS', 409, 'No se puede desactivar la mascota porque tiene turnos futuros pendientes. No se modificó ningún turno.');
}

/** Exige rol profesional/admin o permiso explícito de gestión de pacientes. */
export function assertCanManagePetLifecycle(actor: Pick<AuthUser,'role'|'permissions'>): void {
  if (!patientLifecycleRoles.has(actor.role) || !actor.permissions?.includes('pets.update')) {
    throw new AppError('FORBIDDEN', 403, 'No tenés permiso para cambiar el estado de este paciente.');
  }
}

/** La baja clínica siempre tiene un motivo concreto, visible para el propietario. */
/** Valida y recorta el motivo obligatorio para desactivar una mascota. */
export function requiredPetDeactivationReason(value: unknown): string {
  if (typeof value !== 'string') throw new AppError('VALIDATION_ERROR', 400, 'Ingresá el motivo de desactivación.');
  const reason = value.trim();
  if (reason.length < 3 || reason.length > 500) {
    throw new AppError('VALIDATION_ERROR', 400, 'El motivo debe tener entre 3 y 500 caracteres.');
  }
  return reason;
}

/** Acepta solo transiciones activa↔inactiva permitidas. */
export function assertPetLifecycleTransition(currentIsActive: boolean, nextIsActive: boolean): void {
  if (currentIsActive === nextIsActive) {
    throw new AppError('INVALID_TRANSITION', 409, currentIsActive
      ? 'La mascota ya está activa.'
      : 'La mascota ya está inactiva.');
  }
}

/** Prepara mensaje de notificación de baja con mascota, causa y fecha. */
export function petDeactivationNotification(petName: string, reason: string, date: string, time: string): string {
  return `La mascota "${petName}" fue desactivada de los registros activos de PetCare el ${date} a las ${time}. Motivo: "${reason}". Para obtener más información, comunicate con la clínica.`;
}

/** Prepara mensaje de notificación de reactivación. */
export function petReactivationNotification(petName: string, date: string, time: string): string {
  return `La mascota "${petName}" volvió a estar activa en PetCare el ${date} a las ${time}.`;
}
