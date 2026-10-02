/** Contratos uniformes para las respuestas públicas de la API. */
export type ApiSuccess<T> = { success: true; data: T };
import type { VerificationChallenge } from './verification';
export type ApiFailure = { success: false; error: { code: string; message: string; verification?: VerificationChallenge } };
