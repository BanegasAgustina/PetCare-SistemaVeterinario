/**
 * ARCHIVO: verification.ts
 * UBICACIÓN: backend/src/types/verification.ts
 * FUNCIÓN: Contrato del desafío de verificación de correo.
 * RESPONSABILIDAD: Compartir token, email enmascarado, entrega, vencimiento y tiempos de reenvío.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/services/auth.service.ts, backend/src/services/verification.service.ts, backend/src/types/api.ts, backend/src/utils/app-error.ts
 * FUNCIONAMIENTO: Declara interfaces y uniones de TypeScript para la respuesta de verificación.
 * IMPORTANCIA: Los controladores y servicios validan/forman el mismo mensaje de dominio.
 */
/** Solo el token opaco y metadatos de UX son públicos; jamás el código o sus hashes. */
/** Desafío temporal con token, destino enmascarado, expiración y espera de reenvío. */
export type VerificationChallenge = {
  verificationToken: string; maskedEmail: string; retryAfterSeconds: number;
  expiresAt: string | null; delivery: 'sent' | 'failed' | 'pending';
};
