/**
 * ARCHIVO: mask-email.ts
 * UBICACIÓN: backend/src/utils/mask-email.ts
 * FUNCIÓN: Enmascara la parte local de una dirección de correo.
 * RESPONSABILIDAD: Mostrar destino de verificación sin revelar el email completo.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/services/verification.service.ts
 * FUNCIONAMIENTO: Conserva una porción limitada del usuario y el dominio, con fallback para formatos inusuales.
 * IMPORTANCIA: Reduce exposición de datos personales en pantallas y diagnósticos.
 */
/** Enmascara la presentación sin cambiar el destinatario real. */
/** Conserva dominio y expone solo parte del nombre local del correo. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = [...email.slice(0, at)];
  const visible = local.length > 2 ? local.slice(0, 2).join('') : local[0];
  return `${visible}***${email.slice(at)}`;
}
