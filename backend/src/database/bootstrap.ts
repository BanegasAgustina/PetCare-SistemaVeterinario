/** Instala el esquema nuevo solo en DB vacía. No sustituye ni inventa migraciones históricas. */
import { resolve } from 'node:path';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { checkDatabaseConnection } from '../services/database.service';
import { readMigrationFiles } from './migration-files';
import { withDatabaseLock } from './lock';
export async function bootstrapDatabase():Promise<void>{
  const files=await readMigrationFiles(resolve(__dirname,'../../bootstrap'));await checkDatabaseConnection();
  const c=await databasePool.getConnection();
  try{await withDatabaseLock(c,async()=>{
    const [tables]=await c.execute<RowDataPacket[]>('SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()');
    if(tables.some(t=>t.name==='bootstrap_schema_migrations')){
      const [history]=await c.execute<RowDataPacket[]>('SELECT version,checksum,state FROM bootstrap_schema_migrations');
      if(history.length===files.length&&files.every(f=>history.some(h=>h.version===f.version&&h.checksum===f.checksum&&h.state==='applied'))){console.info('Esquema inicial ya aplicado; no se repitió SQL.');return;}
      throw new Error('Bootstrap parcial o archivo modificado: revisar esquema y progreso antes de continuar.');
    }
    if(tables.length)throw new Error('DB no vacía: bootstrap rechazado. No modifica instalaciones existentes.');
    await c.execute("CREATE TABLE bootstrap_schema_migrations(version VARCHAR(150) PRIMARY KEY,checksum CHAR(64) NOT NULL,state ENUM('running','applied') NOT NULL,completed_steps INT UNSIGNED NOT NULL DEFAULT 0)");
    for(const file of files){await c.execute("INSERT INTO bootstrap_schema_migrations(version,checksum,state) VALUES (?,?,'running')",[file.version,file.checksum]);
      for(let i=0;i<file.statements.length;i++){await c.execute(file.statements[i]);await c.execute('UPDATE bootstrap_schema_migrations SET completed_steps=? WHERE version=?',[i+1,file.version]);}
      await c.execute("UPDATE bootstrap_schema_migrations SET state='applied' WHERE version=?",[file.version]);
    }
    console.info('Esquema inicial y catálogos estructurales preparados, sin cuentas ni datos de demostración.');
  });}finally{c.release();}
}
if(require.main===module)void bootstrapDatabase().catch(error=>{console.error(error instanceof Error&&error.message.startsWith('DB no vacía')?error.message:'No se completó el esquema inicial. Revisá conexión, permisos y bootstrap_schema_migrations; no repitas SQL parcial.');process.exitCode=1;}).finally(()=>databasePool.end());
