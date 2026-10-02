import { AppError } from '../utils/app-error';
export function invalid(message='Revisá los datos ingresados.'): never { throw new AppError('VALIDATION_ERROR',400,message); }
export function clientId(value:unknown):string { if(typeof value!=='string'||!/^[1-9]\d{0,19}$/.test(value)||BigInt(value)>18446744073709551615n)invalid();return value; }
export function clientBody(value:unknown,keys:string[]):Record<string,unknown> {
  if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.includes(key)))invalid();
  return value as Record<string,unknown>;
}
export function text(value:unknown,max:number,optional=false):string|null {
  if(optional&&(value===null||value===undefined||value===''))return null;
  if(typeof value!=='string'||!value.trim()||value.trim().length>max)invalid();return value.trim();
}
export function imageUrl(value:unknown):string|null {
  const result=text(value,2048,true);if(!result)return null;
  try { const url=new URL(result);if(url.protocol!=='https:'||url.username||url.password)invalid('La foto requiere una URL HTTPS pública.'); } catch {invalid('La foto requiere una URL HTTPS pública.');}return result;
}
export function petInput(value:unknown) {
  const body=clientBody(value,['name','speciesId','breedId','birthDate','microchipNumber','photoUrl','weightKg']);
  const birthDate=text(body.birthDate,10,true);
  if(birthDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)||!Number.isFinite(Date.parse(birthDate))||new Date(birthDate).toISOString().slice(0,10)!==birthDate||birthDate>new Date().toISOString().slice(0,10)))invalid('Revisá la fecha de nacimiento.');
  const weightKg=body.weightKg===null||body.weightKg===undefined||body.weightKg===''?null:Number(body.weightKg);
  if(weightKg!==null&&(!Number.isFinite(weightKg)||weightKg<=0||weightKg>9999.99||Math.abs(weightKg*100-Math.round(weightKg*100))>0.000001))invalid('Revisá el peso.');
  return {name:text(body.name,100)!,speciesId:clientId(body.speciesId),breedId:body.breedId?clientId(body.breedId):null,birthDate,
    microchipNumber:text(body.microchipNumber,32,true),photoUrl:imageUrl(body.photoUrl),weightKg};
}
export function cartQuantity(value:unknown):number { if(typeof value!=='number'||!Number.isInteger(value)||value<0||value>99)invalid('La cantidad debe estar entre 0 y 99.');return value; }
export function requestKey(value:unknown):string { if(typeof value!=='string'||!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(value))invalid();return value; }
