/** Objetos privados S3; las imágenes se procesan en memoria, nunca en disco. */
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppError } from '../utils/app-error';
import { clientId, invalid } from '../validators/client.validator';
export const PHOTO_URL_TTL_SECONDS=900;
const keyPattern=/^pets\/([1-9]\d{0,19})\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
export function isPetPhotoKey(value:unknown,owner?:string):value is string {
  if(typeof value!=='string')return false;
  const match=keyPattern.exec(value);return Boolean(match&&(!owner||match[1]===owner));
}
/** Construye S3 con credenciales privadas del backend; virtual/path debe coincidir con Railway Credentials. */
export function photoStorage() {
  const bucket=process.env.BUCKET?.trim(),accessKeyId=process.env.ACCESS_KEY_ID?.trim(),secretAccessKey=process.env.SECRET_ACCESS_KEY?.trim(),region=process.env.REGION?.trim(),endpoint=process.env.ENDPOINT?.trim();
  const unavailable=()=>new AppError('PHOTO_STORAGE_UNAVAILABLE',503,'El almacenamiento de fotos todavía no está configurado.');
  if(!bucket||!accessKeyId||!secretAccessKey||!region||!endpoint)throw unavailable();
  try {const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw unavailable();}catch {throw unavailable();}
  const style=process.env.PET_PHOTO_S3_URL_STYLE?.trim()||'virtual';
  if(!['virtual','path'].includes(style))throw unavailable();
  return {bucket,client:new S3Client({region,endpoint,credentials:{accessKeyId,secretAccessKey},forcePathStyle:style==='path',maxAttempts:3})};
}
/** Valida bytes reales, tamaño y píxeles antes de convertir a WebP, quitando metadatos de la foto original. */
export async function optimizePetPhoto(value:unknown):Promise<Buffer> {
  if(typeof value!=='string'||value.length>7_000_000||!value.length||value.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))invalid('La imagen no es válida o supera 5 MB.');
  const bytes=Buffer.from(value,'base64');if(bytes.length>5*1024*1024)invalid('La imagen supera 5 MB.');
  try {const decoder=sharp(bytes,{limitInputPixels:25_000_000,failOn:'warning'});const metadata=await decoder.metadata();
    if(!['jpeg','png','webp'].includes(metadata.format??'')||(metadata.pages??1)>1)invalid();
    return await decoder.rotate().resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
  }catch {invalid('Elegí una imagen JPEG, PNG o WebP válida, de hasta 25 megapíxeles.');}
}
/** Usa una clave nueva por foto; el servicio elimina el objeto si falla el guardado posterior en MySQL. */
export async function storePetPhoto(owner:string,value:unknown) {
  clientId(owner);const image=await optimizePetPhoto(value);const storage=photoStorage();
  const key=`pets/${owner}/${randomUUID()}.webp`;
  try {await storage.client.send(new PutObjectCommand({Bucket:storage.bucket,Key:key,Body:image,ContentType:'image/webp',CacheControl:'private, max-age=900'}));}
  catch {throw new AppError('PHOTO_STORAGE_UNAVAILABLE',503,'No pudimos subir la foto. Intentá nuevamente.');}
  finally {storage.client.destroy();}
  return {url:key,remove:()=>removePetPhoto(owner,key)};
}
/** Restringe el borrado al prefijo del propietario validado; no acepta URLs ni claves arbitrarias. */
export async function removePetPhoto(owner:string,key:unknown) {
  if(!isPetPhotoKey(key,owner))return;
  const storage=photoStorage();try {await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:key}));}finally {storage.client.destroy();}
}
/** Firma lectura por quince minutos; MySQL conserva la clave estable, nunca una URL que caduca. */
export async function petPhotoUrl(owner:string,key:unknown):Promise<string|null> {
  // Las referencias antiguas al volumen no son recuperables desde el bucket.
  if(!key)return null;
  if(!isPetPhotoKey(key,owner))throw new AppError('PHOTO_REFERENCE_UNSUPPORTED',409,'La foto anterior debe volver a subirse al almacenamiento privado.');
  const storage=photoStorage();try {return await getSignedUrl(storage.client,new GetObjectCommand({Bucket:storage.bucket,Key:key,ResponseContentType:'image/webp'}),{expiresIn:PHOTO_URL_TTL_SECONDS});}finally {storage.client.destroy();}
}
/** Se aplica únicamente a resultados de consultas autorizadas por ownership. */
export async function presentPetPhotos(owner:string,value:unknown):Promise<unknown> {
  if(Array.isArray(value))return Promise.all(value.map(item=>presentPetPhotos(owner,item)));
  if(!value||typeof value!=='object')return value;
  const result:Record<string,unknown>={};
  for(const [key,item] of Object.entries(value))result[key]=key==='photoUrl'?await petPhotoUrl(owner,item):await presentPetPhotos(owner,item);
  return result;
}
