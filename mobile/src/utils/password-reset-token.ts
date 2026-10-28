// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

// Función normalizePasswordResetToken: transforma o prepara datos dentro de este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Función normalizePasswordResetToken: transforma o prepara datos dentro de este módulo.
export function normalizePasswordResetToken(value: unknown): string {
  const rawToken = Array.isArray(value) ? value[0] : value;
  if (typeof rawToken !== 'string') return '';
  return rawToken.trim().toLowerCase();
}

// Función isValidPasswordResetToken: comprueba una regla o condición dentro de este módulo.
export function isValidPasswordResetToken(value: unknown): boolean {
  const token = normalizePasswordResetToken(value);
  return /^[a-f0-9]{64}$/.test(token);
}
