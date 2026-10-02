/** Solo el token opaco y metadatos de UX son públicos; jamás el código o sus hashes. */
export type VerificationChallenge = {
  verificationToken: string; maskedEmail: string; retryAfterSeconds: number;
  expiresAt: string | null; delivery: 'sent' | 'failed' | 'pending';
};
