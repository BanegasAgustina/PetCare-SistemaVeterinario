// Este archivo se encarga de lo siguiente: Tipos de TypeScript que describen datos usados por la aplicación.

/** Solo el token opaco y metadatos de UX son públicos; jamás el código o sus hashes. */
// Tipo VerificationChallenge: define la forma o las opciones válidas de datos usados por este módulo.
export type VerificationChallenge = {
  verificationToken: string; maskedEmail: string; retryAfterSeconds: number;
  expiresAt: string | null; delivery: 'sent' | 'failed' | 'pending';
};
