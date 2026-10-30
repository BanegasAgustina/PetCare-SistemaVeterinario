// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Autentica JWT y revalida usuario/rol activo desde MySQL en cada solicitud protegida. */
import type { RequestHandler } from 'express';
import { findUserById, publicUser } from '../repositories/user.repository';
import { verifyAccessToken, accessTokenSessionVersion,accessTokenFamily } from '../services/token.service';
import { activeFamily } from '../repositories/session.repository';
import { authorizationData } from '../repositories/authorization.repository';
import { AppError } from '../utils/app-error';
import { isAccessSessionCurrent } from '../utils/account-session-guards';

// Función authenticate: concentra una operación reutilizable de este módulo.
export const authenticate: RequestHandler = async (request, response, next) => {
  try {
    const header = request.headers.authorization;
    if (!header) throw new AppError('AUTH_REQUIRED', 401, 'Iniciá sesión para continuar.');
    const match = /^Bearer ([^\s]+)$/i.exec(header);
    if (!match || match[1].length > 4096) throw new AppError('INVALID_TOKEN', 401, 'La sesión no es válida. Iniciá sesión nuevamente.');
    const user = await findUserById(verifyAccessToken(match[1]));
    if (!user || !isAccessSessionCurrent({isActive:user.isActive,userSessionVersion:user.sessionVersion,tokenSessionVersion:accessTokenSessionVersion(match[1])})) throw new AppError('INVALID_TOKEN', 401, 'La sesión no es válida. Iniciá sesión nuevamente.');
    const family=accessTokenFamily(match[1]);
    if(family&&!await activeFamily(family,user.id))throw new AppError('INVALID_TOKEN',401,'La sesión fue revocada.');
    response.locals.authenticatedFamily=family;
    if (!user.emailVerifiedAt) throw new AppError('EMAIL_NOT_VERIFIED', 403, 'Tu correo todavía no está verificado.');
    if (user.mustChangePassword) throw new AppError('PASSWORD_CHANGE_REQUIRED',403,'Tenés que cambiar la contraseña inicial para continuar.');
    response.locals.authenticatedRoleId=user.roleId??null;
    response.locals.authenticatedAccountActive=user.isActive;
    response.locals.authenticatedUser = { ...publicUser(user), ...await authorizationData(user.id,user.role) };
    next();
  } catch (error) { next(error); }
};
