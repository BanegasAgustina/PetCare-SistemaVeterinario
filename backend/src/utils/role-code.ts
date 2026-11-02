/**
 * ARCHIVO: role-code.ts
 * UBICACIÓN: backend/src/utils/role-code.ts
 * FUNCIÓN: Normaliza nombre de rol a código estable.
 * RESPONSABILIDAD: Convertir etiquetas ingresadas a códigos usados en autorización.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/repositories/admin.repository.ts
 * FUNCIONAMIENTO: Normaliza espacios y mayúsculas conforme a las reglas del módulo.
 * IMPORTANCIA: Evita que nombres de presentación se usen como identificadores de rol.
 */
/** Convierte una etiqueta legible en un código estable aceptado por roles.code. */
/** Convierte nombre de rol a código normalizado. */
export function roleCodeFromName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 32).replace(/_+$/g, '');
}
