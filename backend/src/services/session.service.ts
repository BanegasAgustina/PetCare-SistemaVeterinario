/**
 * ARCHIVO: session.service.ts
 * UBICACIÓN: backend/src/services/session.service.ts
 * FUNCIÓN: Emisión y renovación de sesiones de PetCare contra el estado actual de la cuenta.
 * RESPONSABILIDAD: Obtiene usuario y permisos desde repositories, emite access token y rota refresh token; vuelve a comprobar sesión, actividad y versión al renovar.
 * CONEXIONES: Importa: backend/src/types/auth.ts, backend/src/repositories/user.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/repositories/session.repository.ts, backend/src/config/env.ts, backend/src/services/token.service.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/controllers/oauth.controller.ts, backend/src/services/auth.service.ts, backend/src/services/oauth.service.ts, backend/src/services/verification.service.ts
 * FUNCIONAMIENTO: auth/oauth/verification services y middleware → session.service → user/authorization/session repositories y token.service.
 * IMPORTANCIA: Separa la identidad propia de PetCare de las credenciales OAuth y permite revocar sesiones.
 */
/** Emite sesiones PetCare; OAuth nunca aporta roles ni permisos. Renueva contra MySQL. */
import type { StoredUser, AccessSession } from '../types/auth';
import { publicUser, findUserById } from '../repositories/user.repository';
import { authorizationData } from '../repositories/authorization.repository';
import { issueRefresh, rotateRefresh,refreshFamily } from '../repositories/session.repository';
import { getJwtConfiguration } from '../config/env';
import { createAccessToken } from './token.service';
import { AppError } from '../utils/app-error';
/** Carga permisos efectivos y emite access/refresh tokens PetCare para un usuario habilitado. */
export async function sessionForUser(user: StoredUser, refreshToken?: string): Promise<AccessSession> {
  if (!user.isActive || !user.emailVerifiedAt) throw new AppError('INVALID_TOKEN',401,'La cuenta no está habilitada.');
  getJwtConfiguration();
  const authorization=await authorizationData(user.id);
  const refresh=refreshToken??await issueRefresh(user.id,user.sessionVersion);
  const access=createAccessToken(user.id,user.sessionVersion,await refreshFamily(refresh));
  return {user:{...publicUser(user),...authorization},...access,tokenType:'Bearer',refreshToken:refresh};
}
/** Rota el secreto y vuelve a consultar el usuario; cambios de contraseña o estado invalidan la renovación. */
/** Valida el refresh token, rota su familia y vuelve a consultar usuario, rol y permisos antes de emitir sesión. */
export async function refreshSession(value: unknown): Promise<AccessSession> {
  getJwtConfiguration();
  const rotated=await rotateRefresh(value);
  const user=await findUserById(rotated.userId);
  if (!user || user.sessionVersion!==rotated.version) throw new AppError('INVALID_TOKEN',401,'La sesión fue revocada.');
  return sessionForUser(user,rotated.token);
}
