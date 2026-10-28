import type { OAuthProvider } from '../services/oauth.service';

/** Keeps provider buttons in a stable order and fails closed for unknown or missing status. */
export function availableOAuthProviders(availability: Partial<Record<OAuthProvider, boolean>>): OAuthProvider[] {
  return (['google', 'facebook', 'x'] as const).filter(provider => availability[provider] === true);
}
