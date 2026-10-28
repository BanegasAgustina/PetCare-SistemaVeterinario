// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

/** Keep login errors indistinguishable for missing, inactive, or password-mismatched accounts. */
// Función isLoginAllowed: comprueba una regla o condición dentro de este módulo.
export function isLoginAllowed(input:{userExists:boolean;isActive:boolean;passwordMatches:boolean}):boolean {
  return input.userExists&&input.isActive&&input.passwordMatches;
}

/** Access tokens become unusable after account deactivation or session-version rotation. */
// Función isAccessSessionCurrent: comprueba una regla o condición dentro de este módulo.
export function isAccessSessionCurrent(input:{isActive:boolean;userSessionVersion:number;tokenSessionVersion:number}):boolean {
  return input.isActive&&input.userSessionVersion===input.tokenSessionVersion;
}
