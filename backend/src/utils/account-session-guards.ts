/**
 * ARCHIVO: account-session-guards.ts
 * UBICACIÓN: backend/src/utils/account-session-guards.ts
 * FUNCIÓN: Reglas puras para decidir login y vigencia de sesión.
 * RESPONSABILIDAD: Comprobar existencia/estado/clave y versión de sesión sin duplicar condiciones entre auth y middleware.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/middlewares/auth.middleware.ts, backend/src/services/auth.service.ts
 * FUNCIONAMIENTO: Combina flags de entrada y compara versión actual de usuario con la del token.
 * IMPORTANCIA: Evita que cuentas inactivas o sesiones revocadas vuelvan a autenticarse.
 */
/** Keep login errors indistinguishable for missing, inactive, or password-mismatched accounts. */
/** Permite login solo si la cuenta existe, está activa y la contraseña coincide. */
export function isLoginAllowed(input:{userExists:boolean;isActive:boolean;passwordMatches:boolean}):boolean {
  return input.userExists&&input.isActive&&input.passwordMatches;
}

/** Access tokens become unusable after account deactivation or session-version rotation. */
/** Exige cuenta activa y misma versión de sesión en usuario y token. */
export function isAccessSessionCurrent(input:{isActive:boolean;userSessionVersion:number;tokenSessionVersion:number}):boolean {
  return input.isActive&&input.userSessionVersion===input.tokenSessionVersion;
}
