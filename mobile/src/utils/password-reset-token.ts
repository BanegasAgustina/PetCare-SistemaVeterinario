export function normalizePasswordResetToken(value: unknown): string {
  const rawToken = Array.isArray(value) ? value[0] : value;
  if (typeof rawToken !== 'string') return '';
  return rawToken.trim().toLowerCase();
}

export function isValidPasswordResetToken(value: unknown): boolean {
  const token = normalizePasswordResetToken(value);
  return /^[a-f0-9]{64}$/.test(token);
}
