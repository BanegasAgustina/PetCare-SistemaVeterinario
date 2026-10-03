/** Autentica JWT y revalida usuario/rol activo desde MySQL en cada solicitud protegida. */
import type { RequestHandler } from 'express';
import { findUserById, publicUser } from '../repositories/user.repository';
import { verifyAccessToken, accessTokenSessionVersion } from '../services/token.service';
import { authorizationData } from '../repositories/authorization.repository';
import { AppError } from '../utils/app-error';

export const authenticate: RequestHandler = async (request, response, next) => {
  try {
    const header = request.headers.authorization;
    if (!header) throw new AppError('AUTH_REQUIRED', 401, 'Iniciá sesión para continuar.');
    const match = /^Bearer ([^\s]+)$/i.exec(header);
    if (!match || match[1].length > 4096) throw new AppError('INVALID_TOKEN', 401, 'La sesión no es válida. Iniciá sesión nuevamente.');
    const user = await findUserById(verifyAccessToken(match[1]));
    if (!user || !user.isActive || user.sessionVersion !== accessTokenSessionVersion(match[1])) throw new AppError('INVALID_TOKEN', 401, 'La sesión no es válida. Iniciá sesión nuevamente.');
    if (!user.emailVerifiedAt) throw new AppError('EMAIL_NOT_VERIFIED', 403, 'Tu correo todavía no está verificado.');
    response.locals.authenticatedUser = { ...publicUser(user), ...await authorizationData(user.id,user.role) };
    next();
  } catch (error) { next(error); }
};
