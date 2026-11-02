/**
 * ARCHIVO: submission-gate.ts
 * UBICACIÓN: mobile/src/utils/submission-gate.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de submission-gate.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/store-settings.tsx, mobile/src/app/client/(tabs)/store/checkout.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Bloquea una segunda ejecución mientras una operación asíncrona sigue pendiente. */
/** Crea una compuerta que rechaza reentradas mientras una operación asíncrona sigue pendiente. */
export function createSubmissionGate() {
  let active = false;
  return {
    /** Ejecuta una sola tarea; devuelve false si ya hay otra en curso y siempre libera la compuerta al terminar. */
async run(operation: () => Promise<void>): Promise<boolean> {
      if (active) return false;
      active = true;
      try {
        await operation();
        return true;
      } finally {
        active = false;
      }
    },
  };
}
