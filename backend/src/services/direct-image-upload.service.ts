/**
 * ARCHIVO: direct-image-upload.service.ts
 * UBICACIÓN: backend/src/services/direct-image-upload.service.ts
 * FUNCIÓN: Firma y verifica cargas directas de imágenes a Cloudinary.
 * RESPONSABILIDAD: Valida tipo, propietario y permisos; firma parámetros del lado servidor y luego verifica que el recurso remoto pertenezca a la carpeta esperada y respete formato, peso, píxeles y URL segura.
 * CONEXIONES: Importa: backend/src/types/auth.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/routes/media.routes.ts
 * FUNCIONAMIENTO: media.routes.ts → este servicio → AuthUser, permisos y Cloudinary; el cliente sube usando la firma y vuelve para verificar el publicId.
 * IMPORTANCIA: Permite cargas sin pasar los bytes por el backend, manteniendo autorización y verificación del recurso en el servidor.
 */
import { randomUUID } from 'node:crypto';
import { v2 as cloudinary } from 'cloudinary';
import type { AuthUser } from '../types/auth';
import { AppError } from '../utils/app-error';

/** Limita las categorías de archivos para las que el servidor puede firmar una carga. */
export type ImageKind='banner'|'product'|'service'|'pet'|'profile';
/** Define el máximo de bytes que se acepta al verificar el recurso ya cargado. */
const MAX_UPLOAD_BYTES=15*1024*1024;
/** Define el máximo de píxeles permitido para evitar imágenes de dimensiones excesivas. */
const MAX_PIXELS=25_000_000;

/** Lee las credenciales de Cloudinary y configura su cliente; falla con error controlado si falta alguna. */
function configure(){
  const cloud_name=process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key=process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret=process.env.CLOUDINARY_API_SECRET?.trim();
  if(!cloud_name||!api_key||!api_secret)throw new AppError('PHOTO_STORAGE_UNAVAILABLE',503,'Cloudinary no está configurado para recibir imágenes.');
  cloudinary.config({cloud_name,api_key,api_secret,secure:true});
  return {cloud_name,api_key,api_secret};
}
/** Comprueba que el tipo solicitado pertenezca a las categorías de imagen admitidas. */
function parseKind(value:unknown):ImageKind{
  if(['banner','product','service','pet','profile'].includes(String(value)))return value as ImageKind;
  throw new AppError('VALIDATION_ERROR',400,'El tipo de imagen no es válido.');
}
/** Comprueba rol, permisos y propietario; devuelve el identificador que determina la carpeta de almacenamiento. */
function assertAccess(user:AuthUser,kind:ImageKind,targetUserId?:string){
  const permissions=user.permissions??[];
  if(kind==='pet'&&(user.role==='CLIENT'||permissions.includes('personal.pets.manage')))return user.id;
  if(kind==='profile'&&(!targetUserId||targetUserId===user.id)){
    if(user.professional||user.role==='CLIENT'||permissions.some(permission=>permission==='users.manage'||permission==='veterinarians.manage'))return user.id;
  }
  const grant:Record<ImageKind,string>={banner:'store.banners.manage',product:'products.update',service:'services.manage',pet:'pets.update',profile:'users.manage'};
  if(kind==='profile'&&!permissions.some(permission=>permission==='users.manage'||permission==='veterinarians.manage'))throw new AppError('FORBIDDEN',403,'No tenés permiso para subir esta imagen.');
  if(kind==='banner'&&!permissions.some(permission=>permission==='store.banners.manage'||permission==='promotions.manage'||permission==='settings.general.manage'))throw new AppError('FORBIDDEN',403,'No tenés permiso para subir esta imagen.');
  if(kind!=='profile'&&kind!=='banner'&&!permissions.includes(grant[kind]))throw new AppError('FORBIDDEN',403,'No tenés permiso para subir esta imagen.');
  if(kind==='profile'&&!permissions.some(permission=>permission==='users.manage'||permission==='veterinarians.manage'))throw new AppError('FORBIDDEN',403,'No tenés permiso para subir esta imagen.');
  if(targetUserId&&kind==='profile')return targetUserId;
  return user.id;
}
/** Calcula la carpeta de Cloudinary para el tipo de recurso y su propietario cuando corresponda. */
function folderFor(kind:ImageKind,owner:string){return kind==='pet'?`pets/${owner}`:({banner:'banners',product:'products',service:'services',profile:'profiles'} as const)[kind];}
/** Autoriza la carga y devuelve URL, parámetros y firma temporal para que el cliente suba a Cloudinary. */
export function signDirectImageUpload(user:AuthUser,body:unknown){
  const values=body&&typeof body==='object'&&!Array.isArray(body)?body as Record<string,unknown>:{};
  const kind=parseKind(values.kind);
  const target=values.targetUserId===undefined?undefined:String(values.targetUserId);
  if(target&&!/^[1-9]\d{0,19}$/.test(target))throw new AppError('VALIDATION_ERROR',400,'El usuario de destino no es válido.');
  const owner=assertAccess(user,kind,target);
  if(kind==='pet'&&user.role!=='CLIENT'&&!user.permissions?.includes('personal.pets.manage'))throw new AppError('FORBIDDEN',403,'Solo podés subir fotos de tus mascotas.');
  const {cloud_name,api_key,api_secret}=configure();
  const timestamp=Math.floor(Date.now()/1000);
  const folder=folderFor(kind,owner);
  const public_id=randomUUID();
  const params={timestamp,folder,public_id,overwrite:false,format:'webp',allowed_formats:'webp'};
  const signature=cloudinary.utils.api_sign_request(params,api_secret);
  return {uploadUrl:`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`,cloudName:cloud_name,apiKey:api_key,signature,params,kind,maxBytes:MAX_UPLOAD_BYTES,maxPixels:MAX_PIXELS};
}
/** Confirma publicId, carpeta, recurso, formato, tamaño, dimensiones y URL segura antes de aceptar la referencia. */
export async function verifyDirectImageUpload(user:AuthUser,body:unknown){
  const values=body&&typeof body==='object'&&!Array.isArray(body)?body as Record<string,unknown>:{};
  const kind=parseKind(values.kind);
  const target=values.targetUserId===undefined?undefined:String(values.targetUserId);
  if(target&&!/^[1-9]\d{0,19}$/.test(target))throw new AppError('VALIDATION_ERROR',400,'El usuario de destino no es válido.');
  const owner=assertAccess(user,kind,target);
  const publicId=typeof values.publicId==='string'?values.publicId:'';
  const expectedPrefix=`${folderFor(kind,owner)}/`;
  if(!new RegExp(`^${expectedPrefix.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}[a-f0-9-]{36}$`).test(publicId))throw new AppError('VALIDATION_ERROR',400,'La referencia de imagen no es válida.');
  configure();
  let resource:Awaited<ReturnType<typeof cloudinary.api.resource>>;
  try{resource=await cloudinary.api.resource(publicId,{resource_type:'image',type:'upload'});}catch{throw new AppError('IMAGE_UPLOAD_NOT_FOUND',400,'No encontramos la imagen subida. Volvé a intentarlo.');}
  if(resource.format!=='webp'||!Number.isFinite(resource.bytes)||resource.bytes>MAX_UPLOAD_BYTES||!Number.isFinite(resource.width)||!Number.isFinite(resource.height)||resource.width*resource.height>MAX_PIXELS){
    await cloudinary.uploader.destroy(publicId,{resource_type:'image',invalidate:true}).catch(()=>undefined);
    throw new AppError('IMAGE_UPLOAD_INVALID',400,'La imagen debe ser WebP, pesar hasta 15 MB y tener hasta 25 megapíxeles.');
  }
  const {cloud_name}=configure();
  const url=String(resource.secure_url??'');
  if(!url.startsWith(`https://res.cloudinary.com/${cloud_name}/image/upload/`))throw new AppError('IMAGE_UPLOAD_INVALID',400,'No pudimos validar la imagen subida.');
  return {url,publicId,bytes:resource.bytes,width:resource.width,height:resource.height};
}
