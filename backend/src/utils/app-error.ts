/** Error controlado del dominio: solo su código y mensaje pueden salir en la API. */
import type { VerificationChallenge } from '../types/verification';
export class AppError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, public readonly verification?: VerificationChallenge) {
    super(message);
    this.name = 'AppError';
  }
}
