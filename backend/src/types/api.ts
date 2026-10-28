// Este archivo se encarga de lo siguiente: Tipos de TypeScript que describen datos usados por la aplicación.

/** Contratos uniformes para las respuestas públicas de la API. */
// Tipo ApiSuccess: define la forma o las opciones válidas de datos usados por este módulo.
export type ApiSuccess<T> = { success: true; data: T };
import type { VerificationChallenge } from './verification';
// Tipo ApiFailure: define la forma o las opciones válidas de datos usados por este módulo.
export type ApiFailure = { success: false; error: { code: string; message: string; verification?: VerificationChallenge; errors?: {field:string;message:string}[] } };
