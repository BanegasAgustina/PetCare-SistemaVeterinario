/**
 * ARCHIVO: pet-photo.ts
 * UBICACIÓN: mobile/src/utils/pet-photo.ts
 * FUNCIÓN: Regla auxiliar de la interfaz.
 * RESPONSABILIDAD: Regla auxiliar de la interfaz dentro de PetCare; agrupa las declaraciones de pet-photo.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Expone reglas o transformaciones auxiliares; cada función especifica entradas, resultado y condiciones en su implementación.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
// Límite de caracteres que permite un archivo de 4 MiB una vez representado en Base64.
export const PET_PHOTO_MAX_BASE64_LENGTH=5_592_408; // 4 MiB de archivo antes de la expansión Base64.

/** Genera alternativas decrecientes de tamaño/calidad; devuelve [] si las dimensiones originales no son válidas. */
export function petPhotoResizePlan(originalWidth:number,originalHeight:number){
  if(!Number.isFinite(originalWidth)||!Number.isFinite(originalHeight)||originalWidth<=0||originalHeight<=0)return [];
  return [[1200,0.82],[960,0.7],[720,0.58],[480,0.48]].map(([maxDimension,quality])=>{
    const scale=Math.min(1,maxDimension/Math.max(originalWidth,originalHeight));
    return {width:Math.max(1,Math.round(originalWidth*scale)),height:Math.max(1,Math.round(originalHeight*scale)),quality};
  });
}
