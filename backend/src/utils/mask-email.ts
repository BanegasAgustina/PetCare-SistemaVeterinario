// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Enmascara la presentación sin cambiar el destinatario real. */
// Función maskEmail: transforma o prepara datos dentro de este módulo.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = [...email.slice(0, at)];
  const visible = local.length > 2 ? local.slice(0, 2).join('') : local[0];
  return `${visible}***${email.slice(at)}`;
}
