// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Exact-name confirmation deliberately does not trim or normalize user input. */
// Función matchesExactConfirmation: comprueba una regla o condición dentro de este módulo.
export function matchesExactConfirmation(expected: string, entered: string): boolean {
  return expected.length > 0 && entered === expected;
}
