import type { AdminPermission } from '../types/admin';

/** Keeps the custom-role selector focused on permissions the current administrator can assign. */
export function customRolePermissionOptions(permissions:AdminPermission[]) {
  return permissions.filter(permission=>!permission.critical&&permission.canDelegate);
}

/** Existing grants outside the current selector policy are retained when unrelated changes are saved. */
export function preservedCustomRolePermissions(permissions:AdminPermission[],currentCodes:string[]) {
  const options=new Set(customRolePermissionOptions(permissions).map(permission=>permission.code));
  return currentCodes.filter(code=>!options.has(code));
}

/** Explains prerequisite rules in user-facing language without exposing internal permission codes. */
export function rolePermissionHint(permission:AdminPermission) {
  const hints=[permission.description];
  if(permission.code==='recommendations.create')hints.push('Esta función requiere una habilitación profesional y acceso a pacientes y productos.');
  return hints.filter(Boolean).join(' · ');
}
