/**
 * ARCHIVO: pet-photo.service.ts
 * UBICACIÓN: backend/src/services/pet-photo.service.ts
 * FUNCIÓN: Validación, optimización, almacenamiento y presentación de fotos de mascotas y otros recursos visuales.
 * RESPONSABILIDAD: Procesa imágenes, valida claves por carpeta/propietario, soporta el almacenamiento configurado y genera URLs firmadas o transforma referencias al preparar respuestas.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts, backend/src/validators/client.validator.ts Se utiliza desde: backend/src/app.ts, backend/src/controllers/client.controller.ts, backend/src/controllers/clinic.controller.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/storefront.repository.ts y 6 más
 * FUNCIONAMIENTO: Servicios de cliente/clínica y repositories/controladores → pet-photo.service → Sharp, S3 compatible o Cloudinary según operación.
 * IMPORTANCIA: Evita aceptar referencias arbitrarias y mantiene el acceso a imágenes bajo reglas de propiedad y expiración.
 */
/** Objetos privados S3; las imágenes se procesan en memoria, nunca en disco. */
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { S3Client, GetObjectCommand, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v2 as cloudinary } from 'cloudinary';
import { AppError } from '../utils/app-error';
import { clientId, invalid } from '../validators/client.validator';
/** Define la duración de las URL firmadas que permiten leer fotos privadas. */
export const PHOTO_URL_TTL_SECONDS=900;
/** Reconoce claves WebP de mascotas y exige que incluyan el identificador de su propietario. */
const keyPattern=/^pets\/([1-9]\d{0,19})\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
/** Reconoce claves WebP almacenadas bajo la carpeta de productos. */
const productKeyPattern=/^products\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
/** Reconoce claves WebP almacenadas bajo la carpeta de servicios. */
const serviceKeyPattern=/^services\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
/** Reconoce claves WebP almacenadas bajo la carpeta de perfiles. */
const profileKeyPattern=/^profiles\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
/** Reconoce claves WebP almacenadas bajo la carpeta de banners. */
const bannerKeyPattern=/^banners\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
/** Reconoce URL de Cloudinary con el formato y carpetas admitidos para imágenes PetCare. */
const cloudinaryPhotoPattern=/^https:\/\/res\.cloudinary\.com\/([a-zA-Z0-9_-]+)\/image\/upload\/(?:v\d+\/)?((?:pets\/[1-9]\d{0,19}|products|services|profiles|banners)\/[a-f0-9-]{36})\.webp$/;
/** Configura Cloudinary a partir de variables de entorno y falla de forma controlada si faltan credenciales. */
function cloudinaryClient() {
  const cloud_name=process.env.CLOUDINARY_CLOUD_NAME?.trim(),api_key=process.env.CLOUDINARY_API_KEY?.trim(),api_secret=process.env.CLOUDINARY_API_SECRET?.trim();
  if(!cloud_name||!api_key||!api_secret)throw new AppError('PHOTO_STORAGE_UNAVAILABLE',503,'Cloudinary no está configurado. Definí CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en el backend.');
  cloudinary.config({cloud_name,api_key,api_secret,secure:true});return {cloud_name};
}
/** Carga un buffer WebP a Cloudinary dentro de la carpeta indicada y devuelve URL e identificador públicos. */
async function uploadCloudinaryPhoto(image:Buffer,folder:string) {
  cloudinaryClient();
  try {return await new Promise<{secure_url:string;public_id:string}>((resolve,reject)=>{
    const stream=cloudinary.uploader.upload_stream({folder,public_id:randomUUID(),resource_type:'image',format:'webp',allowed_formats:['webp'],transformation:[{quality:'auto:good'}]},(error,result)=>{
      if(error||!result)reject(error??new Error('Upload vacío'));else resolve({secure_url:result.secure_url,public_id:result.public_id});
    });stream.end(image);
  });} catch {throw new AppError('PHOTO_STORAGE_UNAVAILABLE',503,'No pudimos subir la foto a Cloudinary. Intentá nuevamente.');}
}
/** Extrae el public_id solo si la URL coincide con el tipo de recurso y propietario esperado. */
function cloudinaryPublicId(value:unknown,kind:'pets'|'products'|'services'|'profiles'|'banners',owner?:string):string|null {
  if(typeof value!=='string')return null;const match=cloudinaryPhotoPattern.exec(value);if(!match)return null;
  const {cloud_name}=cloudinaryClient();if(match[1]!==cloud_name)return null;
  const id=match[2];if(kind==='profiles'&&/^profiles\/[a-f0-9-]{36}$/.test(id))return id;
  if(kind==='products'&&/^products\/[a-f0-9-]{36}$/.test(id))return id;
  if(kind==='services'&&/^services\/[a-f0-9-]{36}$/.test(id))return id;
  if(kind==='banners'&&/^banners\/[a-f0-9-]{36}$/.test(id))return id;
  if(kind==='pets'&&owner&&id.startsWith(`pets/${owner}/`)&&/^pets\/[1-9]\d{0,19}\/[a-f0-9-]{36}$/.test(id))return id;
  return null;
}
/** Una URL pública guardada no necesita credenciales Cloudinary para poder leerse. */
/** Convierte una URL de Cloudinary permitida en una referencia compatible con el propietario de la mascota. */
function cloudinaryPetUrl(value:unknown,owner:string):string|null {
  if(typeof value!=='string')return null;
  const match=cloudinaryPhotoPattern.exec(value);
  if(!match)return null;
  const id=match[2];
  return id.startsWith(`pets/${owner}/`)&&/^pets\/[1-9]\d{0,19}\/[a-f0-9-]{36}$/.test(id)?value:null;
}
/** Comprueba si la referencia corresponde a una foto de mascota y, si se indica, a su propietario. */
export function isPetPhotoKey(value:unknown,owner?:string):value is string {
  if(typeof value!=='string')return false;
  const match=keyPattern.exec(value);return Boolean((match&&(!owner||match[1]===owner))||cloudinaryPublicId(value,'pets',owner));
}
/** Comprueba si una referencia es una clave o URL compatible de imagen de producto. */
export function isProductPhotoKey(value:unknown):value is string {return typeof value==='string'&&(productKeyPattern.test(value)||Boolean(cloudinaryPublicId(value,'products')));}
/** Comprueba si una referencia es una clave o URL compatible de imagen de servicio. */
export function isServicePhotoKey(value:unknown):value is string {return typeof value==='string'&&(serviceKeyPattern.test(value)||Boolean(cloudinaryPublicId(value,'services')));}
/** Comprueba si una referencia es una clave o URL compatible de foto de perfil. */
export function isProfilePhotoKey(value:unknown):value is string {return typeof value==='string'&&(profileKeyPattern.test(value)||Boolean(cloudinaryPublicId(value,'profiles')));}
/** Comprueba si una referencia es una clave o URL compatible de banner. */
export function isBannerPhotoKey(value:unknown):value is string {return typeof value==='string'&&(bannerKeyPattern.test(value)||Boolean(cloudinaryPublicId(value,'banners')));}
/** Construye S3 con credenciales privadas del backend; virtual/path debe coincidir con Railway Credentials. */
/** Crea cliente S3 compatible validando bucket, endpoint, región, credenciales y estilo de URL. */
export function photoStorage() {
  const bucket=process.env.BUCKET?.trim(),accessKeyId=process.env.ACCESS_KEY_ID?.trim(),secretAccessKey=process.env.SECRET_ACCESS_KEY?.trim(),region=process.env.REGION?.trim(),endpoint=process.env.ENDPOINT?.trim();
  // Función unavailable: agrupa una operación que este módulo puede ejecutar o reutilizar.
const unavailable=()=>new AppError('PHOTO_STORAGE_UNAVAILABLE',503,'El almacenamiento de fotos todavía no está configurado.');
  if(!bucket||!accessKeyId||!secretAccessKey||!region||!endpoint)throw unavailable();
  try {const url=new URL(endpoint);if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw unavailable();}catch {throw unavailable();}
  const style=process.env.PET_PHOTO_S3_URL_STYLE?.trim()||'virtual';
  if(!['virtual','path'].includes(style))throw unavailable();
  return {bucket,client:new S3Client({region,endpoint,credentials:{accessKeyId,secretAccessKey},forcePathStyle:style==='path',maxAttempts:3})};
}
/** Valida bytes reales, tamaño y píxeles antes de convertir a WebP, quitando metadatos de la foto original. */
/** Valida base64, formato y tamaño, decodifica con Sharp y produce WebP optimizado en memoria. */
export async function optimizePetPhoto(value:unknown):Promise<Buffer> {
  if(typeof value!=='string'||value.length>7_000_000||!value.length||value.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))invalid('La imagen no es válida o supera 5 MB.');
  const bytes=Buffer.from(value,'base64');if(bytes.length>5*1024*1024)invalid('La imagen supera 5 MB.');
  try {const decoder=sharp(bytes,{limitInputPixels:25_000_000,failOn:'warning'});const metadata=await decoder.metadata();
    if(!['jpeg','png','webp'].includes(metadata.format??'')||(metadata.pages??1)>1)invalid();
    return await decoder.rotate().resize({width:1200,height:1200,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
  }catch {invalid('Elegí una imagen JPEG, PNG o WebP válida, de hasta 25 megapíxeles.');}
}
/** Usa una clave nueva por foto; el servicio elimina el objeto si falla el guardado posterior en MySQL. */
/** Valida propietario y contenido, optimiza la foto y guarda el objeto bajo la carpeta privada de la mascota. */
export async function storePetPhoto(owner:string,value:unknown) {
  clientId(owner);const image=await optimizePetPhoto(value);const uploaded=await uploadCloudinaryPhoto(image,`pets/${owner}`);
  return {url:uploaded.secure_url,remove:()=>removeCloudinaryPhoto(uploaded.public_id)};
}
/** Restringe el borrado al prefijo del propietario validado; no acepta URLs ni claves arbitrarias. */
/** Elimina una foto solo si la clave pertenece al propietario indicado y al formato esperado. */
export async function removePetPhoto(owner:string,key:unknown) {
  const cloudId=cloudinaryPublicId(key,'pets',owner);if(cloudId){await removeCloudinaryPhoto(cloudId);return;}
  if(!isPetPhotoKey(key,owner))return;
  const storage=photoStorage();try {await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:key}));}finally {storage.client.destroy();}
}
/** Firma lectura por quince minutos; MySQL conserva la clave estable, nunca una URL que caduca. */
/** Devuelve URL temporal de lectura para una referencia autorizada o resuelve formato Cloudinary compatible. */
export async function petPhotoUrl(owner:string,key:unknown):Promise<string|null> {
  // Las referencias antiguas al volumen no son recuperables desde el bucket.
  if(!key)return null;
  // Cloudinary URLs are public and immutable; requiring its API secret/cloud name
  // to return an already stored URL made otherwise healthy patient reads fail.
  if(typeof key==='string'&&cloudinaryPhotoPattern.test(key)) {
    const url=cloudinaryPetUrl(key,owner);
    if(url)return url;
    throw new AppError('PHOTO_REFERENCE_UNSUPPORTED',409,'La foto anterior debe volver a subirse al almacenamiento disponible.');
  }
  if(!isPetPhotoKey(key,owner))throw new AppError('PHOTO_REFERENCE_UNSUPPORTED',409,'La foto anterior debe volver a subirse al almacenamiento disponible.');
  const storage=photoStorage();try {return await getSignedUrl(storage.client,new GetObjectCommand({Bucket:storage.bucket,Key:key,ResponseContentType:'image/webp'}),{expiresIn:PHOTO_URL_TTL_SECONDS});}finally {storage.client.destroy();}
}
/** MySQL conserva la URL permanente de Cloudinary en client_products.image_url. */
/** Optimiza y almacena una imagen de producto, devolviendo la referencia persistible. */
export async function storeProductPhoto(value:unknown) {
  const image=await optimizePetPhoto(value);const uploaded=await uploadCloudinaryPhoto(image,'products');
  return {url:uploaded.secure_url,remove:()=>removeCloudinaryPhoto(uploaded.public_id)};
}
/** Optimiza y almacena una imagen de banner, devolviendo la referencia persistible. */
export async function storeBannerPhoto(value:unknown) {
  const image=await optimizePetPhoto(value);const uploaded=await uploadCloudinaryPhoto(image,'banners');
  return {url:uploaded.secure_url,remove:()=>removeCloudinaryPhoto(uploaded.public_id)};
}
/** Elimina del almacenamiento una clave de banner válida; ignora referencias ajenas o malformadas. */
export async function removeBannerPhoto(key:unknown) {
  const cloudId=cloudinaryPublicId(key,'banners');if(cloudId){await removeCloudinaryPhoto(cloudId);return;}
  if(!bannerKeyPattern.test(String(key??'')))return;const storage=photoStorage();try {await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:String(key)}));}finally {storage.client.destroy();}
}
/** Optimiza y almacena una imagen de servicio, devolviendo la referencia persistible. */
export async function storeServicePhoto(value:unknown) {
  const image=await optimizePetPhoto(value);const uploaded=await uploadCloudinaryPhoto(image,'services');
  return {url:uploaded.secure_url,remove:()=>removeCloudinaryPhoto(uploaded.public_id)};
}
/** Elimina del almacenamiento una clave válida de imagen de servicio. */
export async function removeServicePhoto(key:unknown) {
  const cloudId=cloudinaryPublicId(key,'services');if(cloudId){await removeCloudinaryPhoto(cloudId);return;}
  if(!serviceKeyPattern.test(String(key??'')))return;const storage=photoStorage();try {await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:String(key)}));}finally {storage.client.destroy();}
}
/** Elimina del almacenamiento una clave válida de imagen de producto. */
export async function removeProductPhoto(key:unknown) {
  const cloudId=cloudinaryPublicId(key,'products');if(cloudId){await removeCloudinaryPhoto(cloudId);return;}
  if(!productKeyPattern.test(String(key??'')))return;const storage=photoStorage();try {await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:String(key)}));}finally {storage.client.destroy();}
}
/** Resuelve referencias de producto a su URL pública o firmada según el sistema de almacenamiento. */
export async function productPhotoUrl(key:unknown):Promise<string|null> {
  if(!key)return null;if(cloudinaryPublicId(key,'products'))return String(key);if(!isProductPhotoKey(key))return String(key);
  try {const storage=photoStorage();try {return await getSignedUrl(storage.client,new GetObjectCommand({Bucket:storage.bucket,Key:String(key),ResponseContentType:'image/webp'}),{expiresIn:PHOTO_URL_TTL_SECONDS});}finally {storage.client.destroy();}}
  catch {return null;}
}
/** Resuelve referencias de servicio a su URL pública o firmada según el sistema de almacenamiento. */
export async function servicePhotoUrl(key:unknown):Promise<string|null> {
  if(!key)return null;if(cloudinaryPublicId(key,'services'))return String(key);if(!serviceKeyPattern.test(String(key)))return String(key);
  try {const storage=photoStorage();try {return await getSignedUrl(storage.client,new GetObjectCommand({Bucket:storage.bucket,Key:String(key),ResponseContentType:'image/webp'}),{expiresIn:PHOTO_URL_TTL_SECONDS});}finally {storage.client.destroy();}}
  catch {return null;}
}
/** Fotos de perfiles profesionales: solo el backend escribe, las respuestas usan URL firmada. */
/** Optimiza y almacena foto de perfil en la ubicación configurada. */
export async function storeProfilePhoto(value:unknown) {
  const image=await optimizePetPhoto(value);const uploaded=await uploadCloudinaryPhoto(image,'profiles');
  return {url:uploaded.secure_url,remove:()=>removeCloudinaryPhoto(uploaded.public_id)};
}
/** Elimina una imagen de Cloudinary e invalida la URL en caché; registra un error si el proveedor falla. */
async function removeCloudinaryPhoto(publicId:string) {
  cloudinaryClient();try {const result=await cloudinary.uploader.destroy(publicId,{resource_type:'image',invalidate:true});if(result.result!=='ok'&&result.result!=='not found')throw new Error('Delete failed');}
  catch {throw new AppError('PHOTO_STORAGE_UNAVAILABLE',503,'No pudimos limpiar una foto anterior en Cloudinary.');}
}
/** Elimina una clave válida de foto de perfil del almacenamiento configurado. */
export async function removeProfilePhoto(key:unknown) {
  const cloudId=cloudinaryPublicId(key,'profiles');if(cloudId){await removeCloudinaryPhoto(cloudId);return;}
  if(!isProfilePhotoKey(key))return;const storage=photoStorage();try {await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:key}));}finally {storage.client.destroy();}
}
/** Resuelve una referencia de perfil como URL accesible y rechaza referencias no soportadas. */
export async function profilePhotoUrl(key:unknown):Promise<string|null> {
  if(!key)return null;if(cloudinaryPublicId(key,'profiles'))return String(key);if(!isProfilePhotoKey(key))throw new AppError('PHOTO_REFERENCE_UNSUPPORTED',409,'La foto de perfil anterior debe volver a subirse al almacenamiento disponible.');
  const storage=photoStorage();try {return await getSignedUrl(storage.client,new GetObjectCommand({Bucket:storage.bucket,Key:key,ResponseContentType:'image/webp'}),{expiresIn:PHOTO_URL_TTL_SECONDS});}finally {storage.client.destroy();}
}
/** Guarda comprobantes privados, sin conversiones ni URLs públicas. */
/** Valida comprobante por ID, tamaño y tipo, lo guarda con nombre aleatorio y devuelve la clave privada. */
export async function storePaymentProof(intentId:string,bytes:Buffer,contentType:string){
  if(!/^[1-9]\d{0,19}$/.test(intentId)||bytes.length<8||bytes.length>5*1024*1024)throw new AppError('PAYMENT_PROOF_INVALID',400,'El comprobante debe pesar hasta 5 MB.');
  const types:Record<string,{extension:string;valid:(b:Buffer)=>boolean}>={
    'application/pdf':{extension:'pdf',valid:b=>b.subarray(0,5).toString()==='%PDF-'},
    'image/jpeg':{extension:'jpg',valid:b=>b[0]===0xff&&b[1]===0xd8&&b[2]===0xff},
    'image/png':{extension:'png',valid:b=>b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))},
    'image/webp':{extension:'webp',valid:b=>b.subarray(0,4).toString()==='RIFF'&&b.subarray(8,12).toString()==='WEBP'},
  };
  const kind=types[contentType];if(!kind||!kind.valid(bytes))throw new AppError('PAYMENT_PROOF_INVALID',400,'Usá un comprobante PDF, JPG, PNG o WebP válido.');
  const storage=photoStorage(),key=`payment-proofs/${intentId}/${randomUUID()}.${kind.extension}`;
  try{await storage.client.send(new PutObjectCommand({Bucket:storage.bucket,Key:key,Body:bytes,ContentType:contentType,Metadata:{intent:intentId},ServerSideEncryption:'AES256'}));return {key,remove:async()=>{await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:key}));}};}
  catch{throw new AppError('PAYMENT_PROOF_STORAGE_UNAVAILABLE',503,'No pudimos guardar el comprobante de forma segura. Intentá nuevamente.');}
  finally{storage.client.destroy();}
}
/** Comprueba el formato de la clave y genera una URL firmada temporal para descargar el comprobante. */
export async function paymentProofUrl(key:unknown):Promise<string>{
  if(typeof key!=='string'||!/^payment-proofs\/[1-9]\d{0,19}\/[a-f0-9-]{36}\.(?:pdf|jpg|png|webp)$/.test(key))throw new AppError('NOT_FOUND',404,'No encontramos el comprobante.');
  const storage=photoStorage();try{return await getSignedUrl(storage.client,new GetObjectCommand({Bucket:storage.bucket,Key:key,ResponseContentDisposition:'attachment'}),{expiresIn:300});}finally{storage.client.destroy();}
}
/** Elimina solo claves de comprobantes con el patrón esperado. */
export async function removePaymentProof(key:unknown){
  if(typeof key!=='string'||!/^payment-proofs\/[1-9]\d{0,19}\/[a-f0-9-]{36}\.(?:pdf|jpg|png|webp)$/.test(key))return;
  const storage=photoStorage();try{await storage.client.send(new DeleteObjectCommand({Bucket:storage.bucket,Key:key}));}finally{storage.client.destroy();}
}
/** Se aplica únicamente a resultados de consultas autorizadas por ownership. */
/** Recorre arrays y objetos para convertir los campos de foto de mascota/producto en URL presentables. */
export async function presentPetPhotos(owner:string,value:unknown):Promise<unknown> {
  if(Array.isArray(value))return Promise.all(value.map(item=>presentPetPhotos(owner,item)));
  if(!value||typeof value!=='object')return value;
  const result:Record<string,unknown>={};
  for(const [key,item] of Object.entries(value))result[key]=key==='photoUrl'?await petPhotoUrl(owner,item):key==='imageUrl'?await productPhotoUrl(item):await presentPetPhotos(owner,item);
  return result;
}
/** Recorre una respuesta y resuelve las referencias de imagen de productos para su presentación. */
export async function presentProductImages(value:unknown):Promise<unknown> {
  if(Array.isArray(value))return Promise.all(value.map(presentProductImages));
  if(!value||typeof value!=='object')return value;
  const result:Record<string,unknown>={};for(const [key,item] of Object.entries(value))result[key]=key==='imageUrl'?await productPhotoUrl(item):await presentProductImages(item);return result;
}
/** Recorre una respuesta y resuelve las referencias de imagen de servicios para su presentación. */
export async function presentServiceImages(value:unknown):Promise<unknown> {
  if(Array.isArray(value))return Promise.all(value.map(presentServiceImages));
  if(!value||typeof value!=='object')return value;
  const result:Record<string,unknown>={};for(const [key,item] of Object.entries(value))result[key]=key==='imageUrl'?await servicePhotoUrl(item):await presentServiceImages(item);return result;
}
