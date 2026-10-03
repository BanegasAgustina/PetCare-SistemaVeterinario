/** Aplica únicamente la extensión del formulario sobre las tablas existentes.
 * No depende de restaurar la migración Cliente original eliminada del checkout.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';
async function migrate() {
  const version='002_pet_breed_name.sql';
  const sql=await readFile(resolve(__dirname,'../../client-migrations',version),'utf8');
  const checksum=createHash('sha256').update(sql).digest('hex');const c=await databasePool.getConnection();
  try {await withDatabaseLock(c,async()=>{
    const [history]=await c.execute<RowDataPacket[]>('SELECT checksum,state FROM client_schema_migrations WHERE version=?',[version]);
    if(history.length&&history[0].checksum!==checksum)throw new Error('Historial incompatible.');
    const [columns]=await c.execute<RowDataPacket[]>("SELECT DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE FROM information_schema.columns WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='client_pet_details' AND COLUMN_NAME='breed_name'");
    if(columns.length&&(columns[0].DATA_TYPE!=='varchar'||Number(columns[0].CHARACTER_MAXIMUM_LENGTH)!==100||columns[0].IS_NULLABLE!=='YES'))throw new Error('Columna incompatible.');
    if(history[0]?.state==='applied'){if(!columns.length)throw new Error('Deriva de esquema.');console.info('La extensión del formulario ya está aplicada.');return;}
    if(!history.length)await c.execute("INSERT INTO client_schema_migrations (version,checksum,state) VALUES (?,?,'running')",[version,checksum]);
    if(!columns.length)await c.execute(sql);
    await c.execute("UPDATE client_schema_migrations SET state='applied' WHERE version=?",[version]);
    console.info('Raza libre preparada. No se modificaron registros de negocio.');
  });}finally{c.release();}
}
void migrate().catch(()=>{console.error('No se pudo preparar la extensión del formulario. Revisá esquema e historial.');process.exitCode=1;}).finally(()=>databasePool.end());
