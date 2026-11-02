/**
 * ARCHIVO: profile-photo.ts
 * UBICACIÓN: mobile/src/utils/profile-photo.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de profile-photo.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
// Tipo ProfilePhotoAssetMetadata: define la forma o las opciones válidas de los datos usados por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Tipo ProfilePhotoAssetMetadata: define la forma o las opciones válidas de datos usados por este módulo.
export type ProfilePhotoAssetMetadata = {
  base64?: string | null;
  fileSize?: number | null;
  width: number;
  height: number;
};

// Dato MAX_BASE64_LENGTH: conserva un valor calculado o de configuración usado por este módulo.
const MAX_BASE64_LENGTH = 7_000_000;
// Dato MAX_FILE_SIZE: conserva un valor calculado o de configuración usado por este módulo.
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Dato MAX_PIXELS: conserva un valor calculado o de configuración usado por este módulo.
const MAX_PIXELS = 25_000_000;

/** Comprueba que exista Base64 y que su longitud, tamaño de archivo y cantidad de píxeles estén dentro de límites. */
export function isValidProfilePhotoAsset(asset: ProfilePhotoAssetMetadata): boolean {
  return Boolean(asset.base64)
    && asset.base64!.length <= MAX_BASE64_LENGTH
    && (asset.fileSize ?? 0) <= MAX_FILE_SIZE
    && asset.width * asset.height <= MAX_PIXELS;
}
