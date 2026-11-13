/**
 * ARCHIVO: permission.middleware.ts
 * UBICACIÓN: backend/src/middlewares/permission.middleware.ts
 * FUNCIÓN: Fábricas y guards de autorización por rol, permiso, ruta personal y alcance de paciente.
 * RESPONSABILIDAD: Rechazar solicitudes fuera de rol/permisos o fuera del paciente asociado a la operación.
 * CONEXIONES: Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/config/database.ts, backend/src/utils/database-error.ts, backend/src/utils/personal-access.ts Se utiliza desde: backend/src/app.ts, backend/src/routes/admin.routes.ts, backend/src/routes/client.routes.ts, backend/src/routes/clinic.routes.ts, backend/src/routes/notification.routes.ts, backend/src/routes/veterinarian.routes.ts
 * FUNCIONAMIENTO: Los middleware consultan identidad autenticada y usan utilidades de acceso; los guards preservan el orden requerido por consultas sensibles.
 * IMPORTANCIA: Complementa autenticación: confirma lo que una identidad puede hacer o leer.
 */
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

/** Autoriza si el rol autenticado coincide con uno de los roles permitidos. */
export function requireRole(...roles: RoleCode[]): RequestHandler {
  return (_request,response,next) => {
    const user = response.locals.authenticatedUser as AuthUser | undefined;
    next(user && roles.includes(user.role) ? undefined : new AppError('FORBIDDEN',403,'No tenés acceso a esta función.'));
  };
}
/** Exige todos los permisos indicados antes de continuar. */
export function requirePermission(...codes: string[]): RequestHandler {
  return (_request,response,next) => {
    const user = response.locals.authenticatedUser as AuthUser | undefined;
    next(user && codes.every(code => user.permissions?.includes(code)) ? undefined : new AppError('FORBIDDEN',403,'No tenés permiso para esta acción.'));
  };
}
/** Exige al menos uno de los permisos declarados. */
export function requireAnyPermission(...codes:string[]):RequestHandler {
  return (_req,res,next)=>{const user=res.locals.authenticatedUser as AuthUser|undefined;next(user&&codes.some(code=>user.permissions?.includes(code))?undefined:new AppError('FORBIDDEN',403,'No tenés permiso para esta acción.'));};
}
/** Professional identity is supplied by the persisted professional type, separately from role grants. */
export function requireProfessionalIdentity(clinical?:boolean):RequestHandler {
  return (_request,response,next)=>{
    const user=response.locals.authenticatedUser as AuthUser|undefined;
    const professional=user?.professional;
    next(user&&professional&&(clinical===undefined||professional.isClinical===clinical)?undefined:new AppError('FORBIDDEN',403,'Esta operación requiere una identidad profesional habilitada.'));
  };
}
/** Logs only non-PII authorization facts for a denied patient-list request; never logs request data or credentials. */
/** Conserva el orden de rol, permiso y autorización de repositorio para consultas de pacientes. */
export function patientQueryAuthorizationGuard(stage:'role'|'permission'|'repository',guard:RequestHandler):RequestHandler {
  return (request,response,next)=>guard(request,response,error=>{
    if(error instanceof AppError&&error.status===403){
      const user=response.locals.authenticatedUser as AuthUser|undefined;
      console.warn(JSON.stringify({event:'clinic.patient_query.authorization_denied',guard:stage,
        roleId:response.locals.authenticatedRoleId??null,roleCode:user?.role??null,
        accountActive:response.locals.authenticatedAccountActive===true,
        effectivePermissions:{petsViewAll:user?.permissions?.includes('pets.view_all')??false,
          petsViewInformation:user?.permissions?.includes('pets.view_information')??false,
          appointmentsViewOwn:user?.permissions?.includes('appointments.view_own')??false}}));
    }
    next(error);
  });
}
/** CLIENT conserva su acceso personal; los demás roles requieren grants personales explícitos y actuales. */
/** Autoriza acceso personal usando método y ruta de la solicitud. */
export const requirePersonalAccess:RequestHandler=(req,res,next)=>{
  const user=res.locals.authenticatedUser as AuthUser|undefined;
  next(user&&canAccessPersonalRoute(user.role,user.permissions,req.method,req.path)?undefined:new AppError('FORBIDDEN',403,'No tenés permiso para este módulo personal.'));
};
/** Notification inbox access is role-scoped and never grants other personal, clinical, or administrative capabilities. */
/** Autoriza acceso al centro de notificaciones para los roles permitidos. */
export const requireNotificationAccess:RequestHandler=(_req,res,next)=>{
  const user=res.locals.authenticatedUser as AuthUser|undefined;
  next(user&&canAccessNotificationCenter(user.role)?undefined:new AppError('FORBIDDEN',403,'No tenés permiso para este centro de notificaciones.'));
};
/** Reutilizable por futuras rutas clínicas. No confía en un veterinarianId enviado por el cliente. */
/** Verifica que la mascota de ruta/cuerpo pertenezca al ámbito autorizado. */
export function requirePatientScope(parameter = 'petId'): RequestHandler {
  return async (request,response,next) => {
    try {
      const user = response.locals.authenticatedUser as AuthUser;
      if (user.permissions?.includes('pets.view_all')) { next(); return; }
      if (!user.professional?.isClinical) throw new AppError('FORBIDDEN',403,'No tenés acceso a este paciente.');
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
