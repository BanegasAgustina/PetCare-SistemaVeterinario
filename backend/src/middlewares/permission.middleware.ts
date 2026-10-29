// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Cadena: authenticate -> requireRole -> requirePermission -> scope -> controller.
 * La UI solo mejora UX. Estas comprobaciones utilizan permisos obtenidos de MySQL en authenticate.
 * Los permisos administrativos requieren rol administrativo y grants efectivos de MySQL.
 */
import type { RequestHandler } from 'express';
import type { AuthUser, RoleCode } from '../types/auth';
import { AppError } from '../utils/app-error';
import { databasePool } from '../config/database';
import type { RowDataPacket } from 'mysql2/promise';
import { runDatabaseOperation } from '../utils/database-error';
import { canAccessNotificationCenter, canAccessPersonalRoute } from '../utils/personal-access';

// Función requireRole: concentra la lógica dentro de este módulo.
export function requireRole(...roles: RoleCode[]): RequestHandler {
  return (_request,response,next) => {
    const user = response.locals.authenticatedUser as AuthUser | undefined;
    next(user && roles.includes(user.role) ? undefined : new AppError('FORBIDDEN',403,'No tenés acceso a esta función.'));
  };
}
// Función requirePermission: concentra la lógica dentro de este módulo.
export function requirePermission(...codes: string[]): RequestHandler {
  return (_request,response,next) => {
    const user = response.locals.authenticatedUser as AuthUser | undefined;
    next(user && codes.every(code => user.permissions?.includes(code)) ? undefined : new AppError('FORBIDDEN',403,'No tenés permiso para esta acción.'));
  };
}
// Función requireAnyPermission: concentra la lógica dentro de este módulo.
export function requireAnyPermission(...codes:string[]):RequestHandler {
  return (_req,res,next)=>{const user=res.locals.authenticatedUser as AuthUser|undefined;next(user&&codes.some(code=>user.permissions?.includes(code))?undefined:new AppError('FORBIDDEN',403,'No tenés permiso para esta acción.'));};
}
/** CLIENT conserva su acceso personal; los demás roles requieren grants personales explícitos y actuales. */
// Función requirePersonalAccess: concentra una operación reutilizable de este módulo.
export const requirePersonalAccess:RequestHandler=(req,res,next)=>{
  const user=res.locals.authenticatedUser as AuthUser|undefined;
  next(user&&canAccessPersonalRoute(user.role,user.permissions,req.method,req.path)?undefined:new AppError('FORBIDDEN',403,'No tenés permiso para este módulo personal.'));
};
/** Notification inbox access is role-scoped and never grants other personal, clinical, or administrative capabilities. */
export const requireNotificationAccess:RequestHandler=(_req,res,next)=>{
  const user=res.locals.authenticatedUser as AuthUser|undefined;
  next(user&&canAccessNotificationCenter(user.role)?undefined:new AppError('FORBIDDEN',403,'No tenés permiso para este centro de notificaciones.'));
};
/** Reutilizable por futuras rutas clínicas. No confía en un veterinarianId enviado por el cliente. */
// Función requirePatientScope: concentra la lógica dentro de este módulo.
export function requirePatientScope(parameter = 'petId'): RequestHandler {
  return async (request,response,next) => {
    try {
      const user = response.locals.authenticatedUser as AuthUser;
      if (!['VETERINARIAN','ADMIN','SUPER_ADMIN'].includes(user.role)) throw new AppError('FORBIDDEN',403,'No tenés acceso a este paciente.');
      if (user.permissions?.includes('pets.view_all')) { next(); return; }
      if (user.role !== 'VETERINARIAN') throw new AppError('FORBIDDEN',403,'No tenés acceso a este paciente.');
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
