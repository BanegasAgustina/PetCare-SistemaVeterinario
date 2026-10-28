// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Agrega el indicador para exigir una contraseña propia solo a cuentas de empleado nuevas. */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';

// Dato version: conserva un valor calculado o de configuración usado por este módulo.
const version='001_must_change_password.sql';
// Función migrateEmployeePassword: concentra la lógica dentro de este módulo.
export async function migrateEmployeePassword(){
  const sql=await readFile(resolve(__dirname,'../../employee-password-migrations',version),'utf8');
  const checksum=createHash('sha256').update(sql).digest('hex');
  const connection=await databasePool.getConnection();
  try{await withDatabaseLock(connection,async()=>{
    await connection.execute(`CREATE TABLE IF NOT EXISTS employee_password_schema_migrations (
      version VARCHAR(150) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
      checksum CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
      state ENUM('running','applied') NOT NULL,
      applied_at TIMESTAMP(3) NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);
    const [history]=await connection.execute<RowDataPacket[]>('SELECT checksum,state FROM employee_password_schema_migrations WHERE version=?',[version]);
    if(history.length){if(history[0].checksum!==checksum||history[0].state!=='applied')throw new Error('Historial de contraseñas iniciales incompatible.');console.info('La migración de contraseña inicial ya está aplicada.');return;}
    const [users]=await connection.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users'");
    if(!users.length)throw new Error('No existe users; prepará primero el esquema base.');
    const [columns]=await connection.execute<RowDataPacket[]>("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='users' AND COLUMN_NAME='must_change_password'");
    if(columns.length)throw new Error('users.must_change_password ya existe sin registro de migración; verificá el esquema antes de continuar.');
    await connection.execute('INSERT INTO employee_password_schema_migrations (version,checksum,state) VALUES (?,?,?)',[version,checksum,'running']);
    await connection.execute(sql);
    await connection.execute("UPDATE employee_password_schema_migrations SET state='applied',applied_at=CURRENT_TIMESTAMP(3) WHERE version=?",[version]);
    console.info('Migración de contraseña inicial aplicada; las cuentas existentes conservan su acceso.');
  });}finally{connection.release();}
}
if(require.main===module)void migrateEmployeePassword().catch(()=>{console.error('No se aplicó la migración de contraseña inicial. Revisá users y employee_password_schema_migrations antes de reintentar.');process.exitCode=1;}).finally(()=>databasePool.end());
