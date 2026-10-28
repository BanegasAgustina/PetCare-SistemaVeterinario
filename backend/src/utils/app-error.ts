// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Error controlado del dominio: solo su código y mensaje pueden salir en la API. */
import type { VerificationChallenge } from '../types/verification';
// Tipo ApiFieldError: define la forma o las opciones válidas de datos usados por este módulo.
export type ApiFieldError = { field: string; message: string };
// Clase AppError: agrupa estado y operaciones que trabajan como una unidad.
export class AppError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, public readonly verification?: VerificationChallenge, public readonly fieldErrors?: ApiFieldError[]) {
    super(message);
    this.name = 'AppError';
  }
}
