/** Cadena: authenticate -> requireRole -> requirePermission -> scope -> controller.
 * La UI solo mejora UX. Estas comprobaciones utilizan permisos obtenidos de MySQL en authenticate.
 * Los permisos críticos requieren además SUPER_ADMIN: nunca basta un override malicioso.
 */
import type { RequestHandler } from 'express';
import type { AuthUser, RoleCode } from '../types/auth';
import { AppError } from '../utils/app-error';
import { databasePool } from '../config/database';
import type { RowDataPacket } from 'mysql2/promise';
import { runDatabaseOperation } from '../utils/database-error';

export function requireRole(...roles: RoleCode[]): RequestHandler {
  return (_request,response,next) => {
    const user = response.locals.authenticatedUser as AuthUser | undefined;
    next(user && roles.includes(user.role) ? undefined : new AppError('FORBIDDEN',403,'No tenés acceso a esta función.'));
  };
}
export function requirePermission(...codes: string[]): RequestHandler {
  return (_request,response,next) => {
    const user = response.locals.authenticatedUser as AuthUser | undefined;
    next(user && codes.every(code => user.permissions?.includes(code)) ? undefined : new AppError('FORBIDDEN',403,'No tenés permiso para esta acción.'));
  };
}
/** Reutilizable por futuras rutas clínicas. No confía en un veterinarianId enviado por el cliente. */
export function requirePatientScope(parameter = 'petId'): RequestHandler {
  return async (request,response,next) => {
    try {
      const user = response.locals.authenticatedUser as AuthUser;
      if (user.role === 'SUPER_ADMIN') { next(); return; }
      if (user.role !== 'VETERINARIAN') throw new AppError('FORBIDDEN',403,'No tenés acceso a este paciente.');
      if (user.permissions?.includes('pets.view_all')) { next(); return; }
      if (!user.permissions?.includes('pets.view_assigned')) throw new AppError('FORBIDDEN',403,'No tenés acceso a este paciente.');
      const id = request.params[parameter];
      if (typeof id !== 'string' || !/^[1-9]\d{0,19}$/.test(id)) throw new AppError('FORBIDDEN',403,'No tenés acceso a este paciente.');
      const rows = await runDatabaseOperation(async () => {
        const [result] = await databasePool.execute<RowDataPacket[]>(`SELECT 1 FROM veterinarian_patients vp
          JOIN veterinarians v ON v.id=vp.veterinarian_id WHERE v.user_id=? AND vp.pet_id=? LIMIT 1`,[user.id,id]);
        return result;
      });
      if (!rows.length) throw new AppError('FORBIDDEN',403,'No tenés acceso a este paciente.');
      next();
    } catch(error) { next(error); }
  };
}
