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
  if(!codes.every(code=>actor.permissions?.includes(code)))forbidden();
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
/** SUPER_ADMIN puede delegar permisos funcionales; los críticos siguen exigiendo un grant explícito. */
export function canDelegatePermission(actor:AuthUser,permission:{code:string;critical:boolean}):boolean {
  return permission.critical?Boolean(actor.permissions?.includes(permission.code)):actor.role==='SUPER_ADMIN'||Boolean(actor.permissions?.includes(permission.code));
}
/** Comprueba los permisos que van a cambiar contra la política dinámica de criticidad. */
export function assertRolePermissionDelegation(actor:AuthUser,permissions:{code:string;critical:boolean}[]) {
  if(permissions.some(permission=>!canDelegatePermission(actor,permission)))forbidden('No podés conceder ni modificar este permiso según la política de delegación.');
}
/** Keeps legacy critical grants intact on custom roles without allowing new critical grants. */
export function assertNoNewCriticalCustomRolePermissions(role:string,currentCodes:string[],requested:{code:string;critical:boolean}[]) {
  if(['ADMIN','SUPER_ADMIN'].includes(role))return;
  if(requested.some(permission=>permission.critical&&!currentCodes.includes(permission.code)))forbidden('Este rol no admite nuevos permisos protegidos.');
}
// Valida si el actor tiene autoridad sobre el usuario objetivo.
export function assertTarget(actor:AuthUser,target:{id:string;role:string}) {
  if(actor.role!=='SUPER_ADMIN'&&target.role==='SUPER_ADMIN')forbidden('Solo el administrador principal puede modificar otra cuenta principal.');
}
// Comprueba que el rol y los permisos asignados no excedan la autoridad del actor.
export function assertRoleAssignment(actor:AuthUser,role:string,permissions:string[]) {
  assertAdminPermission(actor,'roles.manage');
  if(role==='SECRETARY')throw new AppError('ROLE_RETIRED',409,'El rol de Secretaría fue retirado; las cuentas existentes deben migrarse a ADMIN.');
  if(role==='SUPER_ADMIN'&&actor.role!=='SUPER_ADMIN')forbidden('Un ADMIN no puede asignar el rol SUPER_ADMIN.');
  if(role==='VETERINARIAN')throw new AppError('VET_PROFILE_REQUIRED',400,'Creá o editá veterinarios desde el módulo profesional para conservar matrícula y especialidades.');
  if(actor.role!=='SUPER_ADMIN')assertDelegation(actor,permissions);
}
