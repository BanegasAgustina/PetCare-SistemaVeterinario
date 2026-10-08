/** Extensión de auth independiente del historial base ausente; exige users previamente existente. */
import { resolve } from 'node:path';
import { databasePool } from '../config/database';
import { readMigrationFiles, verifyMigrationHistory, type MigrationRecord } from './migration-files';
import { withDatabaseLock } from './lock';
export async function migrateAuth() {
  const files = await readMigrationFiles(resolve(__dirname,'../../auth-migrations'));
  const c = await databasePool.getConnection();
  try { await withDatabaseLock(c,async()=>{
    await c.execute("CREATE TABLE IF NOT EXISTS auth_schema_migrations(version VARCHAR(150) PRIMARY KEY,checksum CHAR(64) NOT NULL,state ENUM('running','applied') NOT NULL)");
    const [records] = await c.execute<MigrationRecord[]>('SELECT version,checksum,state FROM auth_schema_migrations');
    verifyMigrationHistory(files,records);
    for (const file of files) {
      if (records.some(r=>r.version===file.version)) continue;
      await c.execute("INSERT INTO auth_schema_migrations VALUES (?,?,'running')",[file.version,file.checksum]);
      for (const sql of file.statements) await c.execute(sql);
      await c.execute("UPDATE auth_schema_migrations SET state='applied' WHERE version=?",[file.version]);
      console.info(`Aplicada ${file.version}`);
    }
  }); } finally { c.release(); }
}
if(require.main===module)void migrateAuth().catch(()=>{console.error('No se aplicó auth. Revisá el esquema base y auth_schema_migrations; no repitas SQL parcial.');process.exitCode=1;}).finally(()=>databasePool.end());
