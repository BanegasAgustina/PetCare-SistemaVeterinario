/**
 * ARCHIVO: admin-permissions.ts
 * UBICACIÓN: mobile/src/utils/admin-permissions.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de admin-permissions.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/admin/permissions.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
// Tipo PermissionModule: define la forma o las opciones válidas de los datos usados por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Tipo PermissionModule: define la forma o las opciones válidas de datos usados por este módulo.
export type PermissionModule = { moduleName: string };

/** Agrupa permisos por moduleName conservando el orden de primera aparición; recibe una lista y devuelve grupos para presentación administrativa. */
export function groupPermissionsByModule<T extends PermissionModule>(permissions: T[]) {
  const groups = new Map<string, T[]>();
  for (const permission of permissions) {
    const current = groups.get(permission.moduleName) ?? [];
    current.push(permission);
    groups.set(permission.moduleName, current);
  }
  return Array.from(groups, ([name, items]) => ({ name, permissions: items }));
}
