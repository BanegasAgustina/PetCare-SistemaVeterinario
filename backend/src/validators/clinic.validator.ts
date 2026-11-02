/**
 * ARCHIVO: clinic.validator.ts
 * UBICACIÓN: backend/src/validators/clinic.validator.ts
 * FUNCIÓN: Valida campos compartidos por catálogos clínicos, productos y disponibilidad.
 * RESPONSABILIDAD: Asegurar rangos numéricos, referencias y fechas/horas con zona antes de persistir cambios.
 * CONEXIONES: Importa: backend/src/validators/client.validator.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/store-orders.repository.ts, backend/src/repositories/storefront.repository.ts, backend/src/services/clinic.service.ts
 * FUNCIONAMIENTO: Reutiliza parsers de cliente, valida imágenes firmadas, enteros, booleanos, IDs, instantes y páginas.
 * IMPORTANCIA: Evita inconsistencias de fechas/catálogos en funciones administrativas y clínicas.
 */
/** Validación estricta y conversión explícita de fechas con zona a UTC para MySQL. */
import { clientBody,clientId,text,invalid,imageUrl } from './client.validator';
export { clientBody as body,clientId as id,text,invalid,imageUrl };
// Formato de key de almacenamiento admitido para productos.
const productImageKey=/^products\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
/** Acepta clave firmada de producto o URL de imagen permitida. */
export function productImage(value:unknown):string|null {return typeof value==='string'&&productImageKey.test(value)?value:imageUrl(value);}
// Formato de key de almacenamiento admitido para servicios.
const serviceImageKey=/^services\/[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\.webp$/;
/** Acepta clave firmada de servicio o URL de imagen permitida. */
export function serviceImage(value:unknown):string|null {return typeof value==='string'&&serviceImageKey.test(value)?value:imageUrl(value);}
/** Exige entero dentro de límites explícitos. */
export function integer(value:unknown,min=0,max=100000000):number {if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)invalid('Revisá el valor numérico.');return value;}
/** Rechaza strings y exige booleano ya parseado. */
export function bool(value:unknown):boolean {if(typeof value!=='boolean')invalid();return value;}
/** Interpreta vacío/nulo como ausencia o valida el ID de cliente. */
export function optionalId(value:unknown):string|null {return value===null||value===''||value===undefined?null:clientId(value);}
/** Exige fecha ISO con zona y la normaliza a timestamp SQL UTC. */
export function instant(value:unknown):string {if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/.test(value)||!Number.isFinite(Date.parse(value)))invalid('La fecha y hora requieren una zona horaria.');const day=value.slice(0,10);const noon=new Date(day+'T12:00:00Z');if(!Number.isFinite(noon.getTime())||noon.toISOString().slice(0,10)!==day)invalid('La fecha no existe.');return new Date(value).toISOString().slice(0,19).replace('T',' ');}
/** Valida número de página de query y devuelve entero positivo. */
export function queryPage(query:Record<string,unknown>) {const page=String(query.page??'1');if(!/^[1-9]\d{0,4}$/.test(page))invalid();return Number(page);}
