// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Solo oculta la presentación; los servicios siguen usando el email normalizado real. */
// Función maskEmail: transforma o prepara datos dentro de este módulo.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = [...email.slice(0, at)];
  return `${local.length > 2 ? local.slice(0, 2).join('') : local[0]}***${email.slice(at)}`;
}
