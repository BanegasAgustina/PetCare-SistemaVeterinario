/**
 * ARCHIVO: app-error.ts
 * UBICACIÓN: backend/src/utils/app-error.ts
 * FUNCIÓN: Clase común de error de aplicación con código y estado HTTP.
 * RESPONSABILIDAD: Transportar errores esperados, detalles de verificación y errores de campo hasta el middleware HTTP.
 * CONEXIONES: Importa: backend/src/types/verification.ts Se utiliza desde: backend/src/config/env.ts, backend/src/config/mail.ts, backend/src/config/oauth.ts, backend/src/controllers/oauth.controller.ts, backend/src/database/create-super-admin.ts, backend/src/database/promote-super-admin.ts, backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/error.middleware.ts y 52 más
 * FUNCIONAMIENTO: AppError amplía Error con code, status, verification y fieldErrors tipados.
 * IMPORTANCIA: Permite que error.middleware.ts convierta fallos de dominio a respuestas públicas uniformes.
 */
/** Error controlado del dominio: solo su código y mensaje pueden salir en la API. */
import type { VerificationChallenge } from '../types/verification';
/** Error público asociado a un campo de formulario. */
export type ApiFieldError = { field: string; message: string };
/** Excepción controlada que el middleware convierte en status/código JSON. */
export class AppError extends Error {
  constructor(public readonly code: string, public readonly status: number, message: string, public readonly verification?: VerificationChallenge, public readonly fieldErrors?: ApiFieldError[]) {
    super(message);
    this.name = 'AppError';
  }
}
