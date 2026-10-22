/** Error controlado del dominio: solo su código y mensaje pueden salir en la API. */
import type { VerificationChallenge } from '../types/verification';
export type ApiFieldError = { field: string; message: string };
export class AppError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, public readonly verification?: VerificationChallenge, public readonly fieldErrors?: ApiFieldError[]) {
    super(message);
    this.name = 'AppError';
  }
}
