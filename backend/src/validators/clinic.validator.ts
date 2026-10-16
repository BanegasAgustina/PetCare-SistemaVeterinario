/** Validación estricta y conversión explícita de fechas con zona a UTC para MySQL. */
import { clientBody,clientId,text,invalid,imageUrl } from './client.validator';
export { clientBody as body,clientId as id,text,invalid,imageUrl };
const productImageKey=/^products\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
export function productImage(value:unknown):string|null {return typeof value==='string'&&productImageKey.test(value)?value:imageUrl(value);}
const serviceImageKey=/^services\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
export function serviceImage(value:unknown):string|null {return typeof value==='string'&&serviceImageKey.test(value)?value:imageUrl(value);}
export function integer(value:unknown,min=0,max=100000000):number {if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)invalid('Revisá el valor numérico.');return value;}
export function bool(value:unknown):boolean {if(typeof value!=='boolean')invalid();return value;}
export function optionalId(value:unknown):string|null {return value===null||value===''||value===undefined?null:clientId(value);}
export function instant(value:unknown):string {if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))invalid('La fecha y hora requieren una zona horaria.');const day=value.slice(0,10);const noon=new Date(day+'T12:00:00Z');if(!Number.isFinite(noon.getTime())||noon.toISOString().slice(0,10)!==day)invalid('La fecha no existe.');return new Date(value).toISOString().slice(0,19).replace('T',' ');}
export function queryPage(query:Record<string,unknown>) {const page=String(query.page??'1');if(!/^[1-9]\d{0,4}$/.test(page))invalid();return Number(page);}
