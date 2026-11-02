/**
 * ARCHIVO: exact-name-confirmation.ts
 * UBICACIÓN: mobile/src/utils/exact-name-confirmation.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de exact-name-confirmation.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/components/admin/ConfirmNameModal.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Exige que el texto no esté vacío y coincida carácter por carácter; no recorta ni normaliza. */
export function matchesExactConfirmation(expected: string, entered: string): boolean {
  return expected.length > 0 && entered === expected;
}
