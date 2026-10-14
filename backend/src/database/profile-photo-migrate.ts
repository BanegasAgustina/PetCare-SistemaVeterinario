/** Migración aditiva e idempotente para la referencia privada de fotos de staff. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

export async function migrateProfilePhoto() {
  const connection=await databasePool.getConnection();
  try {
    await withDatabaseLock(connection,async()=>{
      const [tables]=await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'");
      if(!tables.length)throw new Error('No existe users; aplicá primero el esquema base.');
      const [columns]=await connection.execute<RowDataPacket[]>("SELECT DATA_TYPE,CHARACTER_MAXIMUM_LENGTH,IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='profile_photo_url'");
      if(columns.length){
        const column=columns[0];
        if(column.DATA_TYPE!=='varchar'||Number(column.CHARACTER_MAXIMUM_LENGTH)!==2048||column.IS_NULLABLE!=='YES')throw new Error('users.profile_photo_url existe con una definición incompatible.');
        console.info('users.profile_photo_url ya está preparada.');return;
      }
      await connection.execute('ALTER TABLE users ADD COLUMN profile_photo_url VARCHAR(2048) NULL AFTER phone');
      console.info('Migración aplicada: users.profile_photo_url. No se modificaron usuarios existentes.');
    });
  } finally {connection.release();}
}

if(require.main===module)void migrateProfilePhoto().catch(error=>{
  console.error(error instanceof Error&&error.message.startsWith('No existe users')||error instanceof Error&&error.message.includes('incompatible')?error.message:'No se aplicó la migración de fotos de perfil. Revisá conexión y permisos MySQL.');
  process.exitCode=1;
}).finally(()=>databasePool.end());
