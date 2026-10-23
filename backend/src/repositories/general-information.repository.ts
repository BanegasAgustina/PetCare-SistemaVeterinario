import type { PoolConnection,RowDataPacket } from 'mysql2/promise';
import isEmail from 'validator/lib/isEmail';
import type { AuthUser } from '../types/auth';
import { databasePool } from '../config/database';
import * as clinic from './clinic.repository';
import { AppError } from '../utils/app-error';
import { DatabaseError,runDatabaseOperation } from '../utils/database-error';

export type Weekday='monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
export type OpeningHours=Record<Weekday,{open:boolean;periods:{opensAt:string;closesAt:string}[]}>;
export type GeneralInformation={clinicName:string;description:string|null;logoUrl:string|null;welcomeMessage:string|null;phone:string|null;whatsapp:string|null;publicEmail:string|null;address:string|null;city:string|null;province:string|null;mapUrl:string|null;openingHours:OpeningHours;instagramUrl:string|null;facebookUrl:string|null;xUrl:string|null;websiteUrl:string|null;updatedAt:string|null};
const weekdays:Weekday[]=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const blankHours=():OpeningHours=>Object.fromEntries(weekdays.map(day=>[day,{open:false,periods:[]}])) as unknown as OpeningHours;
export const defaultGeneralInformation=():GeneralInformation=>({clinicName:'PetCare',description:null,logoUrl:null,welcomeMessage:null,phone:null,whatsapp:null,publicEmail:null,address:null,city:null,province:null,mapUrl:null,openingHours:blankHours(),instagramUrl:null,facebookUrl:null,xUrl:null,websiteUrl:null,updatedAt:null});
const fields:(keyof Omit<GeneralInformation,'openingHours'|'updatedAt'>)[]=['clinicName','description','logoUrl','welcomeMessage','phone','whatsapp','publicEmail','address','city','province','mapUrl','instagramUrl','facebookUrl','xUrl','websiteUrl'];
function fieldError(field:string,message:string):never {throw new AppError('VALIDATION_ERROR',400,message,undefined,[{field,message}]);}
function text(value:unknown,field:string,label:string,max:number,required=false):string|null {
  if(value===null||value===undefined||value===''){if(required)fieldError(field,`Ingresá ${label}.`);return null;}
  if(typeof value!=='string')fieldError(field,`Revisá ${label}.`);
  const trimmed=value.trim();if(!trimmed){if(required)fieldError(field,`Ingresá ${label}.`);return null;}
  if(trimmed.length>max)fieldError(field,`${label} admite hasta ${max} caracteres.`);
  return trimmed;
}
function url(value:unknown,field:string,label:string,max=2048):string|null {
  const valueText=text(value,field,label,max);if(!valueText)return null;
  try{const parsed=new URL(valueText);if(parsed.protocol!=='https:'||parsed.username||parsed.password)throw new Error();return parsed.toString();}
  catch{fieldError(field,`${label} debe ser un enlace HTTPS válido.`);}
}
function openingHours(value:unknown):OpeningHours {
  if(!value||typeof value!=='object'||Array.isArray(value))fieldError('openingHours','Configurá los horarios de los siete días.');
  const input=value as Record<string,unknown>;const result=blankHours();
  for(const day of weekdays){
    const raw=input[day];if(!raw||typeof raw!=='object'||Array.isArray(raw))fieldError(`openingHours.${day}`,'Configurá el estado de este día.');
    const row=raw as Record<string,unknown>;if(typeof row.open!=='boolean')fieldError(`openingHours.${day}.open`,'Indicá si el local abre este día.');
    if(!Array.isArray(row.periods)||row.periods.length>2)fieldError(`openingHours.${day}.periods`,'Ingresá hasta dos franjas horarias.');
    const periods=row.periods.map((item,index)=>{
      const period=item&&typeof item==='object'&&!Array.isArray(item)?item as Record<string,unknown>:{};
      const opensAt=period.opensAt,closesAt=period.closesAt;
      if(typeof opensAt!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(opensAt))fieldError(`openingHours.${day}.periods.${index}.opensAt`,'Elegí una hora de apertura válida.');
      if(typeof closesAt!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(closesAt))fieldError(`openingHours.${day}.periods.${index}.closesAt`,'Elegí una hora de cierre válida.');
      if(opensAt>=closesAt)fieldError(`openingHours.${day}.periods.${index}.closesAt`,'La hora de cierre debe ser posterior a la apertura.');
      return {opensAt,closesAt};
    });
    if(row.open&&periods.length===0)fieldError(`openingHours.${day}.periods`,'Agregá al menos una franja para un día abierto.');
    if(!row.open&&periods.length)fieldError(`openingHours.${day}.periods`,'Quitá las franjas de un día cerrado.');
    const sorted=[...periods].sort((a,b)=>a.opensAt.localeCompare(b.opensAt));
    if(sorted.some((period,index)=>index>0&&period.opensAt<sorted[index-1].closesAt))fieldError(`openingHours.${day}.periods`,'Las franjas de atención no pueden superponerse.');
    result[day]={open:row.open,periods:sorted};
  }
  return result;
}
export function validateGeneralInformation(value:unknown):GeneralInformation {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new AppError('VALIDATION_ERROR',400,'Revisá la información de PetCare.');
  const input=value as Record<string,unknown>;const allowed=[...Object.keys(fields),'openingHours'];
  if(Object.keys(input).some(key=>!allowed.includes(key)))throw new AppError('VALIDATION_ERROR',400,'La solicitud contiene campos no admitidos.');
  const out={} as Omit<GeneralInformation,'openingHours'|'updatedAt'>;
  for(const key of fields) {
    const max=key==='clinicName'?120:key==='description'?2000:key==='welcomeMessage'?500:key==='phone'||key==='whatsapp'?40:key==='publicEmail'?254:key==='address'?200:key==='city'||key==='province'?100:2048;
    let parsed:string|null;
    if(['logoUrl','mapUrl','instagramUrl','facebookUrl','xUrl','websiteUrl'].includes(key))parsed=url(input[key],key,key==='logoUrl'?'El logo':key==='mapUrl'?'La ubicación':`El enlace de ${key.replace('Url','')}`);
    else parsed=text(input[key],key,key==='clinicName'?'el nombre de PetCare':key==='publicEmail'?'el correo público':key==='welcomeMessage'?'el mensaje de bienvenida':key==='description'?'la descripción':key==='phone'?'el teléfono':key==='whatsapp'?'el WhatsApp':key==='address'?'la dirección':key==='city'?'la ciudad':'la provincia',max,key==='clinicName');
    if(key==='publicEmail'&&parsed&&!isEmail(parsed,{allow_display_name:false}))fieldError(key,'Ingresá un correo electrónico público válido.');
    if(key==='clinicName')out[key]=parsed!;
    else out[key]=parsed;
  }
  if(!input.openingHours)fieldError('openingHours','Configurá los horarios de atención.');
  return {...out,openingHours:openingHours(input.openingHours),updatedAt:null};
}
function map(row:RowDataPacket):GeneralInformation {
  let hours:OpeningHours;try{const raw=row.openingHoursJson;hours=openingHours(typeof raw==='string'?JSON.parse(raw):raw);}catch{hours=blankHours();}
  return {clinicName:String(row.clinicName||'PetCare'),description:row.description as string|null,logoUrl:row.logoUrl as string|null,welcomeMessage:row.welcomeMessage as string|null,phone:row.phone as string|null,whatsapp:row.whatsapp as string|null,publicEmail:row.publicEmail as string|null,address:row.address as string|null,city:row.city as string|null,province:row.province as string|null,mapUrl:row.mapUrl as string|null,openingHours:hours,instagramUrl:row.instagramUrl as string|null,facebookUrl:row.facebookUrl as string|null,xUrl:row.xUrl as string|null,websiteUrl:row.websiteUrl as string|null,updatedAt:row.updatedAt?new Date(row.updatedAt as string|Date).toISOString():null};
}
const select=`clinic_name AS clinicName,description,logo_url AS logoUrl,welcome_message AS welcomeMessage,public_phone AS phone,whatsapp,public_email AS publicEmail,street_address AS address,city,province,map_url AS mapUrl,opening_hours_json AS openingHoursJson,instagram_url AS instagramUrl,facebook_url AS facebookUrl,x_url AS xUrl,website_url AS websiteUrl,updated_at AS updatedAt`;
async function read():Promise<GeneralInformation>{const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${select} FROM client_general_information WHERE id=1`);return rows[0]?map(rows[0]):defaultGeneralInformation();}
export async function publicGeneralInformation():Promise<GeneralInformation>{
  try{return await runDatabaseOperation(read);}catch(error){if(error instanceof DatabaseError&&error.code==='SCHEMA_UPDATE_REQUIRED')return defaultGeneralInformation();throw error;}
}
export async function adminGeneralInformation(actor:AuthUser):Promise<{information:GeneralInformation;configured:boolean}>{
  clinic.permit(actor,'settings.general.manage');
  try{return {information:await runDatabaseOperation(read),configured:true};}
  catch(error){if(error instanceof DatabaseError&&error.code==='SCHEMA_UPDATE_REQUIRED')return {information:defaultGeneralInformation(),configured:false};throw error;}
}
export async function saveGeneralInformation(actor:AuthUser,value:unknown):Promise<GeneralInformation>{
  const information=validateGeneralInformation(value);
  return clinic.transaction(actor,async(connection:PoolConnection,fresh:AuthUser)=>{
    clinic.permit(fresh,'settings.general.manage');
    await connection.execute(`INSERT INTO client_general_information (id,clinic_name,description,logo_url,welcome_message,public_phone,whatsapp,public_email,street_address,city,province,map_url,opening_hours_json,instagram_url,facebook_url,x_url,website_url,updated_by)
      VALUES (1,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE clinic_name=VALUES(clinic_name),description=VALUES(description),logo_url=VALUES(logo_url),welcome_message=VALUES(welcome_message),public_phone=VALUES(public_phone),whatsapp=VALUES(whatsapp),public_email=VALUES(public_email),street_address=VALUES(street_address),city=VALUES(city),province=VALUES(province),map_url=VALUES(map_url),opening_hours_json=VALUES(opening_hours_json),instagram_url=VALUES(instagram_url),facebook_url=VALUES(facebook_url),x_url=VALUES(x_url),website_url=VALUES(website_url),updated_by=VALUES(updated_by)`,
    [information.clinicName,information.description,information.logoUrl,information.welcomeMessage,information.phone,information.whatsapp,information.publicEmail,information.address,information.city,information.province,information.mapUrl,JSON.stringify(information.openingHours),information.instagramUrl,information.facebookUrl,information.xUrl,information.websiteUrl,fresh.id]);
    return {...information,updatedAt:null};
  });
}
