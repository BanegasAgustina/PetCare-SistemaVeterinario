/** Shares one in-flight operation between callers and releases it after either outcome. */
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
