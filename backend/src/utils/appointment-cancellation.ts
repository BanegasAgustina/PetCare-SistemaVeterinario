// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

import { AppError } from './app-error';

/** Shared boundary for client cancellation; whitespace-only input is never persisted. */
// Función requiredCancellationReason: concentra la lógica dentro de este módulo.
export function requiredCancellationReason(value:unknown):string {
  if(typeof value!=='string')throw new AppError('VALIDATION_ERROR',400,'Ingresá el motivo de cancelación.');
  const reason=value.trim();
  if(reason.length<3||reason.length>500)throw new AppError('VALIDATION_ERROR',400,'Ingresá un motivo de cancelación de entre 3 y 500 caracteres.');
  return reason;
}
