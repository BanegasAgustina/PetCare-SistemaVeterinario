/** Emite sesiones PetCare; OAuth nunca aporta roles ni permisos. Renueva contra MySQL. */
import type { StoredUser, AccessSession } from '../types/auth';
import { publicUser, findUserById } from '../repositories/user.repository';
import { authorizationData } from '../repositories/authorization.repository';
import { issueRefresh, rotateRefresh,refreshFamily } from '../repositories/session.repository';
import { getJwtConfiguration } from '../config/env';
import { createAccessToken } from './token.service';
import { AppError } from '../utils/app-error';
export async function sessionForUser(user: StoredUser, refreshToken?: string): Promise<AccessSession> {
  if (!user.isActive || !user.emailVerifiedAt) throw new AppError('INVALID_TOKEN',401,'La cuenta no está habilitada.');
  getJwtConfiguration();
  const authorization=await authorizationData(user.id,user.role);
  const refresh=refreshToken??await issueRefresh(user.id,user.sessionVersion);
  const access=createAccessToken(user.id,user.sessionVersion,await refreshFamily(refresh));
  return {user:{...publicUser(user),...authorization},...access,tokenType:'Bearer',refreshToken:refresh};
}
/** Rota el secreto y vuelve a consultar el usuario; cambios de contraseña o estado invalidan la renovación. */
export async function refreshSession(value: unknown): Promise<AccessSession> {
  getJwtConfiguration();
  const rotated=await rotateRefresh(value);
  const user=await findUserById(rotated.userId);
  if (!user || user.sessionVersion!==rotated.version) throw new AppError('INVALID_TOKEN',401,'La sesión fue revocada.');
  return sessionForUser(user,rotated.token);
}
