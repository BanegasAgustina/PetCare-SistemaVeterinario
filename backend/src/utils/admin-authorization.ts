/**
 * ARCHIVO: admin-authorization.ts
 * UBICACIÓN: backend/src/utils/admin-authorization.ts
 * FUNCIÓN: Aserciones de permisos y delegación para operaciones de administración.
 * RESPONSABILIDAD: Validar actor, códigos de permiso, objetivo y asignación de roles en repositorios.
 * CONEXIONES: Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/storefront.repository.ts
 * FUNCIONAMIENTO: Consulta role/permissions del actor y lanza AppError FORBIDDEN cuando la operación excede su autoridad.
 * IMPORTANCIA: Centraliza la política backend para que el acceso no dependa del frontend.
 */
/** Límites de delegación: tener un rol administrativo nunca equivale a tener todos los permisos. */
import type { AuthUser } from '../types/auth';
import { AppError } from './app-error';
// Arroja la respuesta común 403 para denegar una operación.
export function forbidden(message='No tenés permiso para esta operación.'):never {throw new AppError('FORBIDDEN',403,message);}
// Requiere rol administrativo y los permisos indicados para el actor.
export function assertAdminPermission(actor:AuthUser,...codes:string[]) {
  if(!['ADMIN','SUPER_ADMIN'].includes(actor.role)||!codes.every(code=>actor.permissions?.includes(code)))forbidden();
}
/** Autoriza módulos operativos por grant efectivo aunque el actor tenga un rol personalizado. */
// Comprueba permisos de capacidad sin asumir que el usuario es superadmin.
export function assertCapabilityPermission(actor:AuthUser,...codes:string[]) {
  if(!codes.every(code=>actor.permissions?.includes(code)))forbidden();
}
// Impide delegar códigos que el actor no puede administrar.
export function assertDelegation(actor:AuthUser,codes:string[]) {
  if(codes.some(code=>!actor.permissions?.includes(code)))forbidden('No podés conceder ni modificar permisos que no tenés.');
}
// Valida si el actor tiene autoridad sobre el usuario objetivo.
export function assertTarget(actor:AuthUser,target:{id:string;role:string}) {
  if(actor.role==='ADMIN'&&target.role==='SUPER_ADMIN')forbidden('Un ADMIN no puede modificar una cuenta SUPER_ADMIN.');
}
// Comprueba que el rol y los permisos asignados no excedan la autoridad del actor.
export function assertRoleAssignment(actor:AuthUser,role:string,permissions:string[]) {
  assertAdminPermission(actor,'roles.manage');
  if(role==='SECRETARY')throw new AppError('ROLE_RETIRED',409,'El rol de Secretaría fue retirado; las cuentas existentes deben migrarse a ADMIN.');
  if(role==='SUPER_ADMIN'&&actor.role!=='SUPER_ADMIN')forbidden('Un ADMIN no puede asignar el rol SUPER_ADMIN.');
  if(role==='VETERINARIAN')throw new AppError('VET_PROFILE_REQUIRED',400,'Creá o editá veterinarios desde el módulo profesional para conservar matrícula y especialidades.');
  assertDelegation(actor,permissions);
}
