/** Exact-name confirmation deliberately does not trim or normalize user input. */
export function matchesExactConfirmation(expected: string, entered: string): boolean {
  return expected.length > 0 && entered === expected;
}
