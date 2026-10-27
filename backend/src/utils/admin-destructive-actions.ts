import { AppError } from './app-error';

export const protectedSystemRoleCodes = new Set(['CLIENT','VETERINARIAN','GROOMER','SECRETARY','ADMIN','SUPER_ADMIN']);

export function assertCustomRoleDeletable(roleCode:string, assignedUsers:number):void {
  if(protectedSystemRoleCodes.has(roleCode))throw new AppError('PROTECTED_ROLE',409,'Los roles del sistema no se pueden eliminar.');
  if(assignedUsers>0)throw new AppError('ROLE_IN_USE',409,'El rol tiene usuarios asignados; reasignalos antes de eliminarlo.');
}

export function assertAccountDeactivationAllowed(input:{actorId:string;targetId:string;targetRole:string;activeVerifiedSuperAdmins:number}):void {
  if(input.actorId===input.targetId)throw new AppError('FORBIDDEN',403,'No podés desactivar tu propia cuenta.');
  if(input.targetRole==='SUPER_ADMIN'&&input.activeVerifiedSuperAdmins<=1)throw new AppError('FORBIDDEN',403,'No se puede desactivar al último SUPER_ADMIN activo y verificado.');
}

