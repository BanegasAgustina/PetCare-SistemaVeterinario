// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

// Tipo PermissionModule: define la forma o las opciones válidas de los datos usados por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Tipo PermissionModule: define la forma o las opciones válidas de datos usados por este módulo.
export type PermissionModule = { moduleName: string };

// Función groupPermissionsByModule: concentra la lógica dentro de este módulo.
export function groupPermissionsByModule<T extends PermissionModule>(permissions: T[]) {
  const groups = new Map<string, T[]>();
  for (const permission of permissions) {
    const current = groups.get(permission.moduleName) ?? [];
    current.push(permission);
    groups.set(permission.moduleName, current);
  }
  return Array.from(groups, ([name, items]) => ({ name, permissions: items }));
}
