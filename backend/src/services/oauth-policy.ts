// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

import { AppError } from '../utils/app-error';

// Tipo OAuthExchangeAction: define la forma o las opciones válidas de datos usados por este módulo.
export type OAuthExchangeAction = 'link' | 'conflict' | 'register' | 'authenticate';

/** Decide únicamente por la identidad estable del proveedor; el email nunca vincula cuentas. */
// Función oauthExchangeAction: concentra la lógica dentro de este módulo.
export function oauthExchangeAction(accountUserId: string | null, linkUserId: string | null): OAuthExchangeAction {
  if (linkUserId) return accountUserId && accountUserId !== linkUserId ? 'conflict' : 'link';
  return accountUserId ? 'authenticate' : 'register';
}

// Función assertOAuthRegistrationEmailAvailable: comprueba una regla o condición dentro de este módulo.
export function assertOAuthRegistrationEmailAvailable(emailExists: boolean): void {
  if (emailExists) throw new AppError('OAUTH_LINK_REQUIRED', 409, 'Ese email ya tiene una cuenta. Iniciá sesión con contraseña y vinculá el proveedor desde tu perfil.');
}

// Función shouldIssueSessionAfterVerification: concentra la lógica dentro de este módulo.
export function shouldIssueSessionAfterVerification(hasLinkedOAuthAccount: boolean): boolean {
  return hasLinkedOAuthAccount;
}
