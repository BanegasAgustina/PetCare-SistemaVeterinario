/**
 * ARCHIVO: verification.service.ts
 * UBICACIÓN: mobile/src/services/verification.service.ts
 * FUNCIÓN: Valida desafíos de verificación de email y ofrece reenvío de código y confirmación.
 * RESPONSABILIDAD: Aislar el contrato de verificación entre formularios, API y contexto de autenticación.
 * CONEXIONES: Importa: mobile/src/services/api.ts, mobile/src/types/auth.ts Se utiliza desde: mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/auth.service.ts
 * FUNCIONAMIENTO: Envía solicitudes por apiRequest y comprueba tipos, formato, vencimiento y estado de entrega recibidos del servidor.
 * IMPORTANCIA: Impide que datos de verificación mal formados se propaguen al modal o al flujo de sesión.
 */
/** Contrato de verificación: solo código y token opaco; ningún secreto SMTP en mobile. */
import { apiRequest, ApiError } from './api';
import type { VerificationChallenge } from '../types/auth';
/** Comprueba la estructura del desafío y agrega la hora local de recepción. */
export function readVerification(value: unknown): VerificationChallenge {
  /** Error uniforme para respuestas incompletas o con campos fuera del contrato. */
  const invalid = () => new ApiError('INVALID_RESPONSE', 'No pudimos validar la solicitud de verificación.');
  if (!value || typeof value !== 'object') throw invalid();
  const challenge = value as VerificationChallenge;
  if (typeof challenge.verificationToken !== 'string' || !/^[a-f0-9]{64}$/.test(challenge.verificationToken) ||
    typeof challenge.maskedEmail !== 'string' || !challenge.maskedEmail.includes('@') ||
    !Number.isInteger(challenge.retryAfterSeconds) || challenge.retryAfterSeconds < 0 || challenge.retryAfterSeconds > 3600 ||
    !['sent', 'failed', 'pending'].includes(challenge.delivery) ||
    (challenge.expiresAt !== null && (typeof challenge.expiresAt !== 'string' || !Number.isFinite(Date.parse(challenge.expiresAt))))) throw invalid();
  return { receivedAt: Date.now(), verificationToken: challenge.verificationToken, maskedEmail: challenge.maskedEmail, retryAfterSeconds: challenge.retryAfterSeconds, expiresAt: challenge.expiresAt, delivery: challenge.delivery };
}
/** Solicita otro código y valida de nuevo el desafío devuelto por el servidor. */
export async function resendCode(verificationToken: string): Promise<VerificationChallenge> {
  const result = await apiRequest<{ verification: unknown }>('/auth/resend-verification', { method: 'POST', body: { verificationToken } });
  return readVerification(result.verification);
}
/** Envía el código; exige verified=true y devuelve la sesión opcional para AuthContext. */
export async function verifyCode(verificationToken: string, code: string): Promise<unknown | null> {
  const result = await apiRequest<{ verified: boolean; session?: unknown }>('/auth/verify-email', { method: 'POST', body: { verificationToken, code } });
  if (result.verified !== true) throw new ApiError('INVALID_RESPONSE', 'No pudimos confirmar la verificación.');
  return result.session === undefined ? null : result.session;
}
