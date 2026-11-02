/**
 * ARCHIVO: password-reset-token.ts
 * UBICACIÓN: mobile/src/utils/password-reset-token.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de password-reset-token.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/reset-password.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Extrae el primer valor si la query llega como array, valida tipo y normaliza espacios/mayúsculas. */
export function normalizePasswordResetToken(value: unknown): string {
  const rawToken = Array.isArray(value) ? value[0] : value;
  if (typeof rawToken !== 'string') return '';
  return rawToken.trim().toLowerCase();
}

/** Comprueba que el token normalizado tenga 64 caracteres hexadecimales. */
export function isValidPasswordResetToken(value: unknown): boolean {
  const token = normalizePasswordResetToken(value);
  return /^[a-f0-9]{64}$/.test(token);
}
