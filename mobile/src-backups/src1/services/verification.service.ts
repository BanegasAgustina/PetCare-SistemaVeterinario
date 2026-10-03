/** Contrato de verificación: solo código y token opaco; ningún secreto SMTP en mobile. */
import { apiRequest, ApiError } from './api';
import type { VerificationChallenge } from '../types/auth';
export function readVerification(value: unknown): VerificationChallenge {
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
export async function resendCode(verificationToken: string): Promise<VerificationChallenge> {
  const result = await apiRequest<{ verification: unknown }>('/auth/resend-verification', { method: 'POST', body: { verificationToken } });
  return readVerification(result.verification);
}
export async function verifyCode(verificationToken: string, code: string): Promise<void> {
  const result = await apiRequest<{ verified: boolean }>('/auth/verify-email', { method: 'POST', body: { verificationToken, code } });
  if (result.verified !== true) throw new ApiError('INVALID_RESPONSE', 'No pudimos confirmar la verificación.');
}
