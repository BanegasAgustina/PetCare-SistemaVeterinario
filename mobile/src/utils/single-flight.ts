/**
 * ARCHIVO: single-flight.ts
 * UBICACIÓN: mobile/src/utils/single-flight.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de single-flight.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/contexts/AuthContext.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Comparte una misma Promise mientras la tarea está pendiente; libera la referencia al resolver/rechazar y propaga el error. */
export function createSingleFlight<T>() {
  let current: Promise<T> | null = null;
  return (task: () => Promise<T>): Promise<T> => {
    if (current) return current;
    const operation = task();
    current = operation;
    void operation.finally(() => {
      if (current === operation) current = null;
    }).catch(() => undefined);
    return operation;
  };
}
