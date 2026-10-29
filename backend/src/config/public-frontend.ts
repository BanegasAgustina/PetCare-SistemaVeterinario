// Este archivo se encarga de lo siguiente: Expone la URL pública validada para enlaces enviados por el backend.

import { env } from './env';
import { buildPublicFrontendUrl, type PublicFrontendLinkKind } from '../utils/public-frontend-url';

export function publicFrontendUrl(kind: PublicFrontendLinkKind, token?: string): URL {
  return buildPublicFrontendUrl(kind, token, process.env.PUBLIC_FRONTEND_URL, env.nodeEnvironment, process.env.BACKEND_URL);
}
