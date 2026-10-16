/** Solo oculta la presentación; los servicios siguen usando el email normalizado real. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = [...email.slice(0, at)];
  return `${local.length > 2 ? local.slice(0, 2).join('') : local[0]}***${email.slice(at)}`;
}
