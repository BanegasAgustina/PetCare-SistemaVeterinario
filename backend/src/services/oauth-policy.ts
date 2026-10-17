import { AppError } from '../utils/app-error';

export type OAuthExchangeAction = 'link' | 'conflict' | 'register' | 'authenticate';

/** Decide únicamente por la identidad estable del proveedor; el email nunca vincula cuentas. */
export function oauthExchangeAction(accountUserId: string | null, linkUserId: string | null): OAuthExchangeAction {
  if (linkUserId) return accountUserId && accountUserId !== linkUserId ? 'conflict' : 'link';
  return accountUserId ? 'authenticate' : 'register';
}

export function assertOAuthRegistrationEmailAvailable(emailExists: boolean): void {
  if (emailExists) throw new AppError('OAUTH_LINK_REQUIRED', 409, 'Ese email ya tiene una cuenta. Iniciá sesión con contraseña y vinculá el proveedor desde tu perfil.');
}

export function shouldIssueSessionAfterVerification(hasLinkedOAuthAccount: boolean): boolean {
  return hasLinkedOAuthAccount;
}
