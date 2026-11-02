/**
 * ARCHIVO: mask-email.ts
 * UBICACIÓN: mobile/src/utils/mask-email.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de mask-email.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Oculta parte del usuario local para mostrar una pista; no altera el email que usan los servicios. */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return '***';
  const local = [...email.slice(0, at)];
  return `${local.length > 2 ? local.slice(0, 2).join('') : local[0]}***${email.slice(at)}`;
}
