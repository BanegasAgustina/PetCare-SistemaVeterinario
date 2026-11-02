/**
 * ARCHIVO: oauth-availability.ts
 * UBICACIÓN: mobile/src/utils/oauth-availability.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de oauth-availability.
 * CONEXIONES: Importa: mobile/src/services/oauth.service.ts Se utiliza desde: mobile/src/components/ui/OAuthSignInOptions.tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
import type { OAuthProvider } from '../services/oauth.service';

/** Keeps provider buttons in a stable order and fails closed for unknown or missing status. */
export function availableOAuthProviders(availability: Partial<Record<OAuthProvider, boolean>>): OAuthProvider[] {
  return (['google', 'facebook', 'x'] as const).filter(provider => availability[provider] === true);
}
