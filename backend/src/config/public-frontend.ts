/**
 * ARCHIVO: public-frontend.ts
 * UBICACIÓN: backend/src/config/public-frontend.ts
 * FUNCIÓN: Construye URLs públicas del frontend para invitaciones y recuperación.
 * RESPONSABILIDAD: Adaptar el enlace al origen configurado y al entorno sin aceptar URLs arbitrarias.
 * CONEXIONES: Importa: backend/src/config/env.ts, backend/src/utils/public-frontend-url.ts Se utiliza desde: backend/src/services/invitation.service.ts, backend/src/services/password-reset.service.ts
 * FUNCIONAMIENTO: Delega construcción y validación a buildPublicFrontendUrl con variables de entorno normalizadas.
 * IMPORTANCIA: Invitaciones y restablecimiento dependen de enlaces que regresen a la web pública correcta.
 */
import { env } from './env';
import { buildPublicFrontendUrl, type PublicFrontendLinkKind } from '../utils/public-frontend-url';

/** Devuelve URL para el tipo de enlace solicitado y el token temporal cuando corresponda. */
export function publicFrontendUrl(kind: PublicFrontendLinkKind, token?: string): URL {
  return buildPublicFrontendUrl(kind, token, process.env.PUBLIC_FRONTEND_URL, env.nodeEnvironment, process.env.BACKEND_URL);
}
