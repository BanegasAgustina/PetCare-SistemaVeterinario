/** Bloquea una segunda ejecución mientras una operación asíncrona sigue pendiente. */
export function createSubmissionGate() {
  let active = false;
  return {
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
