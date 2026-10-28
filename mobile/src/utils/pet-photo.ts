// Este archivo se encarga de lo siguiente: Funciones auxiliares reutilizables para reglas de formato, validación o navegación.

// Dato PET_PHOTO_MAX_BASE64_LENGTH: conserva un valor calculado o de configuración usado por este módulo.
// Propósito: Funciones auxiliares reutilizables; resuelven reglas de formato, validación o navegación.

// Dato PET_PHOTO_MAX_BASE64_LENGTH: conserva un valor calculado o de configuración usado por este módulo.
export const PET_PHOTO_MAX_BASE64_LENGTH=5_592_408; // 4 MiB de archivo antes de la expansión Base64.

// Función petPhotoResizePlan: concentra la lógica dentro de este módulo.
export function petPhotoResizePlan(originalWidth:number,originalHeight:number){
  if(!Number.isFinite(originalWidth)||!Number.isFinite(originalHeight)||originalWidth<=0||originalHeight<=0)return [];
  return [[1200,0.82],[960,0.7],[720,0.58],[480,0.48]].map(([maxDimension,quality])=>{
    const scale=Math.min(1,maxDimension/Math.max(originalWidth,originalHeight));
    return {width:Math.max(1,Math.round(originalWidth*scale)),height:Math.max(1,Math.round(originalHeight*scale)),quality};
  });
}
