export type PermissionModule = { moduleName: string };

export function groupPermissionsByModule<T extends PermissionModule>(permissions: T[]) {
  const groups = new Map<string, T[]>();
  for (const permission of permissions) {
    const current = groups.get(permission.moduleName) ?? [];
    current.push(permission);
    groups.set(permission.moduleName, current);
  }
  return Array.from(groups, ([name, items]) => ({ name, permissions: items }));
}
