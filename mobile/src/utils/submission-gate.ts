// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

/** Bloquea una segunda ejecución mientras una operación asíncrona sigue pendiente. */
// Función createSubmissionGate: crea un registro o inicia una operación dentro de este módulo.
export function createSubmissionGate() {
  let active = false;
  return {
    // Función run: implementa esta operación de la clase o del objeto.
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
