/** Enmascara la presentación sin cambiar el destinatario real. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = [...email.slice(0, at)];
  const visible = local.length > 2 ? local.slice(0, 2).join('') : local[0];
  return `${visible}***${email.slice(at)}`;
}
