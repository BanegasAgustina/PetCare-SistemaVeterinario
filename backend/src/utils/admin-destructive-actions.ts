// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

import { AppError } from './app-error';

// SECRETARY is legacy data until migration 002 is applied; keep it undeletable in-app meanwhile.
// Dato protectedSystemRoleCodes: conserva un valor calculado o de configuración usado por este módulo.
export const protectedSystemRoleCodes = new Set(['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN','SECRETARY']);

// Función assertCustomRoleDeletable: comprueba una regla o condición dentro de este módulo.
export function assertCustomRoleDeletable(roleCode:string, assignedUsers:number):void {
  if(protectedSystemRoleCodes.has(roleCode))throw new AppError('PROTECTED_ROLE',409,'Los roles del sistema no se pueden eliminar.');
  if(assignedUsers>0)throw new AppError('ROLE_IN_USE',409,'El rol tiene usuarios asignados; reasignalos antes de eliminarlo.');
}

// Función assertAccountDeactivationAllowed: comprueba una regla o condición dentro de este módulo.
export function assertAccountDeactivationAllowed(input:{actorId:string;targetId:string;targetRole:string;activeVerifiedSuperAdmins:number}):void {
  if(input.actorId===input.targetId)throw new AppError('FORBIDDEN',403,'No podés desactivar tu propia cuenta.');
  if(input.targetRole==='SUPER_ADMIN'&&input.activeVerifiedSuperAdmins<=1)throw new AppError('FORBIDDEN',403,'No se puede desactivar al último SUPER_ADMIN activo y verificado.');
}

