/** Prepara la clave de idempotencia para altas clínicas; no modifica datos existentes. */
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';
import type { RowDataPacket } from 'mysql2/promise';

async function main(){
 const c=await databasePool.getConnection();
 try{await withDatabaseLock(c,async()=>{
  await c.execute(`CREATE TABLE IF NOT EXISTS clinic_patient_create_requests (
   actor_user_id BIGINT UNSIGNED NOT NULL,
   request_key CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
   payload_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
   pet_id BIGINT UNSIGNED NOT NULL,
   created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
   PRIMARY KEY(actor_user_id,request_key),
   KEY idx_clinic_patient_create_pet(pet_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
  const [columns]=await c.execute<Array<RowDataPacket & {COLUMN_NAME:string;DATA_TYPE:string;IS_NULLABLE:string}>>("SELECT COLUMN_NAME,DATA_TYPE,IS_NULLABLE FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='clinic_patient_create_requests'");
  const actual=new Map(columns.map(column=>[column.COLUMN_NAME,column]));
  if(actual.get('actor_user_id')?.DATA_TYPE!=='bigint'||actual.get('request_key')?.DATA_TYPE!=='char'||actual.get('payload_hash')?.DATA_TYPE!=='char'||actual.get('pet_id')?.DATA_TYPE!=='bigint')throw new Error('La tabla de idempotencia no coincide con el esquema esperado.');
  console.info('Clave idempotente de altas de pacientes preparada.');
 });}finally{c.release();await databasePool.end();}
}
void main().catch(()=>{console.error('No se pudo preparar la idempotencia de altas clínicas. Revisá el esquema antes de reintentar.');process.exitCode=1;});
