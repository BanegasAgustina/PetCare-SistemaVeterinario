/**
 * ARCHIVO: api.ts
 * UBICACIÓN: backend/src/types/api.ts
 * FUNCIÓN: Contratos genéricos del sobre HTTP de éxito y error.
 * RESPONSABILIDAD: Mantener respuestas del backend tipadas entre controladores y consumidores.
 * CONEXIONES: Importa: backend/src/types/verification.ts Se utiliza desde: backend/src/controllers/database-health.controller.ts, backend/src/controllers/health.controller.ts, backend/src/middlewares/error.middleware.ts
 * FUNCIONAMIENTO: Declara tipos TypeScript; no produce lógica ni valores en runtime.
 * IMPORTANCIA: Hace explícita la forma uniforme de las respuestas JSON.
 */
/** Contratos uniformes para las respuestas públicas de la API. */
/** Sobre estándar para respuesta exitosa con datos tipados. */
export type ApiSuccess<T> = { success: true; data: T };
import type { VerificationChallenge } from './verification';
/** Sobre de error con código, mensaje y detalles opcionales de verificación/campo. */
export type ApiFailure = { success: false; error: { code: string; message: string; verification?: VerificationChallenge; errors?: {field:string;message:string}[] } };
