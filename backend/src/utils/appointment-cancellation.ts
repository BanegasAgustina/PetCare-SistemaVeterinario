/**
 * ARCHIVO: appointment-cancellation.ts
 * UBICACIÓN: backend/src/utils/appointment-cancellation.ts
 * FUNCIÓN: Valida el motivo obligatorio para cancelar una cita.
 * RESPONSABILIDAD: Normalizar razón de cancelación antes de registrar estado e historial.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/clinic.repository.ts
 * FUNCIONAMIENTO: Recorta el valor, comprueba presencia y longitud y lanza AppError de validación si no es válido.
 * IMPORTANCIA: Evita cancelaciones sin causa trazable.
 */
import { AppError } from './app-error';

/** Shared boundary for client cancellation; whitespace-only input is never persisted. */
/** Recorta el motivo y exige valor no vacío con longitud máxima permitida. */
export function requiredCancellationReason(value:unknown):string {
  if(typeof value!=='string')throw new AppError('VALIDATION_ERROR',400,'Ingresá el motivo de cancelación.');
  const reason=value.trim();
  if(reason.length<3||reason.length>500)throw new AppError('VALIDATION_ERROR',400,'Ingresá un motivo de cancelación de entre 3 y 500 caracteres.');
  return reason;
}
