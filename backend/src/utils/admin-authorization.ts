/** Límites de delegación: tener un rol administrativo nunca equivale a tener todos los permisos. */
import type { AuthUser } from '../types/auth';
import { AppError } from './app-error';
export function forbidden(message='No tenés permiso para esta operación.'):never {throw new AppError('FORBIDDEN',403,message);}
export function assertAdminPermission(actor:AuthUser,...codes:string[]) {
  if(!['ADMIN','SUPER_ADMIN'].includes(actor.role)||!codes.every(code=>actor.permissions?.includes(code)))forbidden();
}
export function assertDelegation(actor:AuthUser,codes:string[]) {
  if(codes.some(code=>!actor.permissions?.includes(code)))forbidden('No podés conceder ni modificar permisos que no tenés.');
}
export function assertTarget(actor:AuthUser,target:{id:string;role:string}) {
  if(actor.role==='ADMIN'&&target.role==='SUPER_ADMIN')forbidden('Un ADMIN no puede modificar una cuenta SUPER_ADMIN.');
}
export function assertRoleAssignment(actor:AuthUser,role:string,permissions:string[]) {
  assertAdminPermission(actor,'roles.manage');
  if(role==='SUPER_ADMIN'&&actor.role!=='SUPER_ADMIN')forbidden('Un ADMIN no puede asignar el rol SUPER_ADMIN.');
  if(role==='VETERINARIAN')throw new AppError('VET_PROFILE_REQUIRED',400,'Creá o editá veterinarios desde el módulo profesional para conservar matrícula y especialidades.');
  assertDelegation(actor,permissions);
}
