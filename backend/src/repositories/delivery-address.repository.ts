// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';
import { clientBody, clientId, text, invalid } from '../validators/client.validator';

// Dato columns: conserva un valor calculado o de configuración usado por este módulo.
const columns = `CAST(id AS CHAR) AS id,label,recipient_name AS recipientName,phone,street,street_number AS streetNumber,unit,city,province,postal_code AS postalCode,reference`;
// Función withAddressSchema: concentra la lógica dentro de este módulo.
async function withAddressSchema<T>(operation:()=>Promise<T>):Promise<T>{
  try{return await runDatabaseOperation(operation);}catch(error){if(error instanceof DatabaseError&&error.code==='SCHEMA_UPDATE_REQUIRED')throw new AppError('STORE_ADDRESSES_SCHEMA_REQUIRED',503,'Las direcciones guardadas requieren la migración 006.');throw error;}
}
// Función list: obtiene o consulta información dentro de este módulo.
export async function list(owner: string) {
  return withAddressSchema(async()=>{const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT ${columns} FROM client_delivery_addresses WHERE owner_id=? AND is_active=1 ORDER BY updated_at DESC,id DESC`, [owner]);return rows;});
}

// Función save: actualiza o guarda información dentro de este módulo.
export async function save(owner: string, value: unknown, rawId?: unknown) {
  return withAddressSchema(async()=>{
  const body = clientBody(value, ['label','recipientName','phone','street','streetNumber','unit','city','province','postalCode','reference']);
  // Función required: agrupa una operación que este módulo puede ejecutar o reutilizar.
const required = (key: string, label: string, max: number) => { const result = text(body[key], max); if (!result) invalid(`Ingresá ${label.toLocaleLowerCase('es')}.`); return result.trim(); };
  const label = text(body.label, 80, true)?.trim() || 'Casa';
  const recipientName = required('recipientName','nombre del destinatario',160);
  const phone = required('phone','teléfono',40);
  const street = required('street','calle',160);
  const streetNumber = required('streetNumber','número',30);
  const unit = text(body.unit,80,true)?.trim() || null;
  const city = required('city','ciudad',100);
  const province = required('province','provincia',100);
  const postalCode = required('postalCode','código postal',16);
  const reference = text(body.reference,500,true)?.trim() || null;
  let id: string;
  if(rawId!==undefined){
    id=clientId(rawId);
    const [result]=await databasePool.execute(`UPDATE client_delivery_addresses SET label=?,recipient_name=?,phone=?,street=?,street_number=?,unit=?,city=?,province=?,postal_code=?,reference=? WHERE id=? AND owner_id=? AND is_active=1`,[label,recipientName,phone,street,streetNumber,unit,city,province,postalCode,reference,id,owner]);
    if((result as {affectedRows?:number}).affectedRows!==1) throw new AppError('NOT_FOUND',404,'La dirección guardada no existe.');
  } else {
    const [result] = await databasePool.execute(`INSERT INTO client_delivery_addresses (owner_id,label,recipient_name,phone,street,street_number,unit,city,province,postal_code,reference) VALUES (?,?,?,?,?,?,?,?,?,?,?)`, [owner,label,recipientName,phone,street,streetNumber,unit,city,province,postalCode,reference]);
    id = String((result as {insertId?: number|string}).insertId);
  }
  const [rows] = await databasePool.execute<RowDataPacket[]>(`SELECT ${columns} FROM client_delivery_addresses WHERE id=? AND owner_id=?`, [id,owner]);
  if (!rows[0]) throw new AppError('NOT_FOUND',404,'No se pudo guardar la dirección.');
  return rows[0];
  });
}
