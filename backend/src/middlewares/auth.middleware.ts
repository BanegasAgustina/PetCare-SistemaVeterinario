/**
 * ARCHIVO: auth.middleware.ts
 * UBICACIÓN: backend/src/middlewares/auth.middleware.ts
 * FUNCIÓN: Autentica solicitudes Bearer y carga identidad vigente desde almacenamiento.
 * RESPONSABILIDAD: Validar token, sesión y estado de cuenta antes de permitir que las rutas continúen.
 * CONEXIONES: Importa: backend/src/repositories/user.repository.ts, backend/src/services/token.service.ts, backend/src/repositories/session.repository.ts, backend/src/repositories/authorization.repository.ts, backend/src/utils/app-error.ts, backend/src/utils/account-session-guards.ts Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/auth.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/media.routes.ts, backend/src/routes/notification.routes.ts, backend/src/routes/veterinarian.routes.ts
 * FUNCIONAMIENTO: Extrae access token, lo verifica, consulta usuario/sesión/versión y establece authenticatedUser/family en res.locals.
 * IMPORTANCIA: Es la frontera de identidad que usan routers protegidos.
 */
/** Autentica JWT y revalida usuario/rol activo desde MySQL en cada solicitud protegida. */
import type { RequestHandler } from 'express';
import { findUserById, publicUser } from '../repositories/user.repository';
import { verifyAccessToken, accessTokenSessionVersion,accessTokenFamily } from '../services/token.service';
import { activeFamily } from '../repositories/session.repository';
import { authorizationData } from '../repositories/authorization.repository';
import { AppError } from '../utils/app-error';
import { isAccessSessionCurrent } from '../utils/account-session-guards';

/** Comprueba Bearer, sesión y cuenta activa y adjunta el actor autenticado a locals. */
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
    response.locals.authenticatedUser = { ...publicUser(user), ...await authorizationData(user.id) };
    next();
  } catch (error) { next(error); }
};
