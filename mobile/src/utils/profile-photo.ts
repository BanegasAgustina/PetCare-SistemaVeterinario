// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

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

// Función isValidProfilePhotoAsset: comprueba una regla o condición dentro de este módulo.
export function isValidProfilePhotoAsset(asset: ProfilePhotoAssetMetadata): boolean {
  return Boolean(asset.base64)
    && asset.base64!.length <= MAX_BASE64_LENGTH
    && (asset.fileSize ?? 0) <= MAX_FILE_SIZE
    && asset.width * asset.height <= MAX_PIXELS;
}
