/** Extensión aditiva de pets; nunca crea entidades ni modifica propietario/relaciones. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

export async function migratePetPhoto() {
  const connection=await databasePool.getConnection();
  try {
    await withDatabaseLock(connection,async()=>{
      const [tables]=await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pets'");
      if(!tables.length)throw new Error('No existe la tabla pets; no se aplicó la migración.');
      const [columns]=await connection.execute<RowDataPacket[]>("SELECT COLUMN_NAME,DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pets' AND COLUMN_NAME IN ('id','owner_id','microchip_number','photo_url')");
      const byName=new Map(columns.map(column=>[String(column.COLUMN_NAME),column]));
      if(!byName.has('id')||!byName.has('owner_id')||!byName.has('microchip_number'))throw new Error('La tabla pets no coincide con el modelo usado por la aplicación; no se aplicó la migración.');
      const existing=byName.get('photo_url');
      if(existing){if(existing.DATA_TYPE!=='varchar'||Number(existing.CHARACTER_MAXIMUM_LENGTH)!==2048||existing.IS_NULLABLE!=='YES')throw new Error('pets.photo_url existe con una definición incompatible.');console.info('pets.photo_url ya existe con la definición esperada.');return;}
      const sql=await readFile(resolve(__dirname,'../../pet-migrations/001_pets_photo_url.sql'),'utf8');
      await connection.execute(sql.trim());
      console.info('Migración aplicada: pets.photo_url VARCHAR(2048) NULL. No se modificaron registros ni relaciones.');
    });
  } finally {connection.release();}
}

if(require.main===module)void migratePetPhoto().catch(error=>{
  console.error(error instanceof Error&&(error.message.startsWith('No existe')||error.message.includes('no coincide')||error.message.includes('incompatible'))?error.message:'No se aplicó la migración de fotos de mascotas. Revisá conexión y esquema MySQL.');
  process.exitCode=1;
}).finally(()=>databasePool.end());
