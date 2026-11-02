/**
 * ARCHIVO: admin-destructive-actions.ts
 * UBICACIÓN: backend/src/utils/admin-destructive-actions.ts
 * FUNCIÓN: Reglas de protección para borrar roles y desactivar cuentas.
 * RESPONSABILIDAD: Impedir cambios que eliminen roles de sistema o dejen el sistema sin superadministrador.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/admin.repository.ts
 * FUNCIONAMIENTO: Evalúa código/usuarios asignados y actor/objetivo con conteo de superadmins activos verificados.
 * IMPORTANCIA: Protege invariantes administrativas antes de ejecutar la escritura SQL.
 */
import { AppError } from './app-error';

// SECRETARY is legacy data until migration 002 is applied; keep it undeletable in-app meanwhile.
// Códigos que no se pueden borrar ni tratar como roles personalizados.
export const protectedSystemRoleCodes = new Set(['CLIENT','VETERINARIAN','GROOMER','ADMIN','SUPER_ADMIN','SECRETARY']);

/** Protege roles del sistema y rechaza borrar un rol que aún tiene usuarios. */
export function assertCustomRoleDeletable(roleCode:string, assignedUsers:number):void {
  if(protectedSystemRoleCodes.has(roleCode))throw new AppError('PROTECTED_ROLE',409,'Los roles del sistema no se pueden eliminar.');
  if(assignedUsers>0)throw new AppError('ROLE_IN_USE',409,'El rol tiene usuarios asignados; reasignalos antes de eliminarlo.');
}

/** Evita auto-baja y la desactivación del último superadministrador activo/verificado. */
export function assertAccountDeactivationAllowed(input:{actorId:string;targetId:string;targetRole:string;activeVerifiedSuperAdmins:number}):void {
  if(input.actorId===input.targetId)throw new AppError('FORBIDDEN',403,'No podés desactivar tu propia cuenta.');
  if(input.targetRole==='SUPER_ADMIN'&&input.activeVerifiedSuperAdmins<=1)throw new AppError('FORBIDDEN',403,'No se puede desactivar al último SUPER_ADMIN activo y verificado.');
}

