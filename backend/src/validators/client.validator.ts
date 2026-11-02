/**
 * ARCHIVO: client.validator.ts
 * UBICACIÓN: backend/src/validators/client.validator.ts
 * FUNCIÓN: Valida IDs, cuerpos cliente, datos de mascota, imágenes, cantidad y claves de solicitud.
 * RESPONSABILIDAD: Rechazar campos no permitidos y restringir rangos/formatos de las operaciones cliente.
 * CONEXIONES: Importa: backend/src/utils/app-error.ts Se utiliza desde: backend/src/app.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/delivery-address.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/store-payment.repository.ts, backend/src/services/client.service.ts, backend/src/services/pet-photo.service.ts, backend/src/validators/clinic.validator.ts y 1 más
 * FUNCIONAMIENTO: Conjunto de parsers desde unknown que normalizan datos y reportan errores de campo con AppError.
 * IMPORTANCIA: Se usa antes de operaciones de mascota, carrito y checkout.
 */
/**
 * Valida formularios, IDs y filtros del cliente antes de consultar MySQL. Restringe campos y tamaños; la validación frontend es ayuda de UX y no sustituye estos controles.
 */
import { AppError } from '../utils/app-error';
// Arroja validación 400 y opcionalmente adjunta un error asociado a campo.
export function invalid(message='Revisá los datos ingresados.',field?:string): never { throw new AppError('VALIDATION_ERROR',400,message,undefined,field?[{field,message}]:undefined); }
/** Valida ID decimal positivo dentro del rango BIGINT sin perder precisión. */
export function clientId(value:unknown):string { if(typeof value!=='string'||!/^[1-9]\d{0,19}$/.test(value)||BigInt(value)>18446744073709551615n)invalid();return value; }
/** Valida objeto y limita sus claves a la allowlist entregada. */
export function clientBody(value:unknown,keys:string[]):Record<string,unknown> {
  if(!value||typeof value!=='object'||Array.isArray(value))invalid();
  const extra=Object.keys(value).filter(key=>!keys.includes(key));
  if(extra.length)throw new AppError('VALIDATION_ERROR',400,'Revisá los datos ingresados.',undefined,extra.map(field=>({field,message:'Este campo no está permitido.'})));
  return value as Record<string,unknown>;
}
/** Recorta texto y valida ausencia opcional y límite de longitud. */
export function text(value:unknown,max:number,optional=false):string|null {
  if(optional&&(value===null||value===undefined||value===''))return null;
  if(typeof value!=='string'||!value.trim()||value.trim().length>max)invalid();return value.trim();
}
/** Acepta solo referencias de imagen con esquema de URL permitido. */
export function imageUrl(value:unknown):string|null {
  const result=text(value,2048,true);if(!result)return null;
  try { const url=new URL(result);if(url.protocol!=='https:'||url.username||url.password)invalid('La foto requiere una URL HTTPS pública.'); } catch {invalid('La foto requiere una URL HTTPS pública.');}return result;
}
/** Valida y normaliza campos editables de mascota. */
export function petInput(value:unknown) {
  const body=clientBody(value,['name','sex','speciesId','breedId','breedName','birthDate','microchipNumber','photoUrl','photoBase64','weightKg']);
  const sex=text(body.sex,10)!;
  if(!['FEMALE','MALE','UNKNOWN'].includes(sex))invalid('Seleccioná el sexo de la mascota.');
  const birthDate=text(body.birthDate,10,true);
  if(birthDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)||!Number.isFinite(Date.parse(birthDate))||new Date(birthDate).toISOString().slice(0,10)!==birthDate||birthDate>new Date().toISOString().slice(0,10)))invalid('Revisá la fecha de nacimiento.');
  const weightKg=body.weightKg===null||body.weightKg===undefined||body.weightKg===''?null:Number(body.weightKg);
  if(weightKg!==null&&(!Number.isFinite(weightKg)||weightKg<=0||weightKg>9999.99||Math.abs(weightKg*100-Math.round(weightKg*100))>0.000001))invalid('Revisá el peso.');
  return {name:text(body.name,100)!,sex:sex as 'FEMALE'|'MALE'|'UNKNOWN',speciesId:clientId(body.speciesId),breedId:body.breedId?clientId(body.breedId):null,birthDate,
    breedName:text(typeof body.breedName==='string'?body.breedName.trim():body.breedName,100,true),
    microchipNumber:text(typeof body.microchipNumber==='string'?body.microchipNumber.trim():body.microchipNumber,32,true),photoUrl:imageUrl(body.photoUrl),weightKg};
}
/** Limita la cantidad del carrito a entero entre 0 y 99. */
export function cartQuantity(value:unknown):number { if(typeof value!=='number'||!Number.isInteger(value)||value<0||value>99)invalid('La cantidad debe estar entre 0 y 99.');return value; }
/** Valida UUID versión 4 usado como clave idempotente de checkout. */
export function requestKey(value:unknown):string { if(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))invalid();return value; }
