/** Migración aditiva e independiente: no depende del historial SQL incompleto del checkout. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

const version='001_password_resets.sql';
export async function migratePasswordResets(){
  const sql=await readFile(resolve(__dirname,'../../password-reset-migrations',version),'utf8');
  const checksum=createHash('sha256').update(sql).digest('hex');
  const connection=await databasePool.getConnection();
  try{await withDatabaseLock(connection,async()=>{
    await connection.execute(`CREATE TABLE IF NOT EXISTS password_reset_schema_migrations (
      version VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
      checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
      state ENUM('running','applied') NOT NULL,
      applied_at TIMESTAMP(3) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    const [history]=await connection.execute<RowDataPacket[]>('SELECT checksum,state FROM password_reset_schema_migrations WHERE version=?',[version]);
    if(history.length){if(history[0].checksum!==checksum||history[0].state!=='applied')throw new Error('Historial de recuperación incompleto o incompatible. Inspeccioná el esquema antes de continuar.');console.info('La migración de recuperación ya está aplicada.');return;}
    const [users]=await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'");
    if(!users.length)throw new Error('No existe users; prepará primero el esquema base.');
    const [existing]=await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='password_resets'");
    if(existing.length)throw new Error('Existe password_resets sin registro de migración; verificá manualmente el esquema antes de continuar.');
    await connection.execute('INSERT INTO password_reset_schema_migrations (version,checksum,state) VALUES (?,? ,?)',[version,checksum,'running']);
    await connection.execute(sql);
    await connection.execute("UPDATE password_reset_schema_migrations SET state='applied',applied_at=CURRENT_TIMESTAMP(3) WHERE version=?",[version]);
    console.info('Migración de recuperación aplicada; no se modificaron cuentas existentes.');
  });}finally{connection.release();}
}
if(require.main===module)void migratePasswordResets().catch(()=>{console.error('No se aplicó la migración de recuperación. Revisá el esquema y password_reset_schema_migrations antes de reintentar.');process.exitCode=1;}).finally(()=>databasePool.end());
