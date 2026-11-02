/**
 * ARCHIVO: oauth-policy.ts
 * UBICACIÓN: backend/src/services/oauth-policy.ts
 * FUNCIÓN: Reglas puras para resolver acciones de OAuth y políticas de vinculación/verificación.
 * RESPONSABILIDAD: Decide entre vincular, detectar conflicto, autenticar o registrar comparando identificadores estables del proveedor; el correo no se usa para vincular cuentas.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/services/oauth.service.ts, backend/src/services/verification.service.ts
 * FUNCIONAMIENTO: oauth.service.ts y verification.service.ts → funciones de política; AppError expresa el conflicto de registro.
 * IMPORTANCIA: Mantiene las decisiones de seguridad pequeñas, explícitas y reutilizables sin acceso a red ni base de datos.
 */
import { AppError } from '../utils/app-error';

/** Enumera las cuatro decisiones posibles para un callback OAuth. */
export type OAuthExchangeAction = 'link' | 'conflict' | 'register' | 'authenticate';

/** Decide únicamente por la identidad estable del proveedor; el email nunca vincula cuentas. */
/** Compara subject externo vinculado y usuario objetivo para decidir vincular, rechazar conflicto, autenticar o registrar. */
export function oauthExchangeAction(accountUserId: string | null, linkUserId: string | null): OAuthExchangeAction {
  if (linkUserId) return accountUserId && accountUserId !== linkUserId ? 'conflict' : 'link';
  return accountUserId ? 'authenticate' : 'register';
}

/** Impide crear por OAuth otra cuenta cuando el email ya existe; exige iniciar sesión y vincular explícitamente. */
export function assertOAuthRegistrationEmailAvailable(emailExists: boolean): void {
  if (emailExists) throw new AppError('OAUTH_LINK_REQUIRED', 409, 'Ese email ya tiene una cuenta. Iniciá sesión con contraseña y vinculá el proveedor desde tu perfil.');
}

/** Permite sesión inmediata solo cuando la cuenta OAuth ya vinculada satisface la política de verificación. */
export function shouldIssueSessionAfterVerification(hasLinkedOAuthAccount: boolean): boolean {
  return hasLinkedOAuthAccount;
}
