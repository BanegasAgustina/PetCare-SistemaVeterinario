/** Aplica solo la ampliación auditada, con progreso durable ante DDL no transaccional. */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from './lock';
async function main(){const sql=await readFile(resolve(process.cwd(),'clinic-migrations/001_connected_clinic.sql'),'utf8');const checksum=createHash('sha256').update(sql).digest('hex');const statements=sql.replace(/--[^\r\n]*/g,'').split(';').map(s=>s.trim()).filter(Boolean);const c=await databasePool.getConnection();try{await withDatabaseLock(c,async()=>{
 const [ledgerTable]=await c.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='clinic_schema_migrations'");
 if(ledgerTable.length){const [adoption]=await c.execute<RowDataPacket[]>('SELECT state FROM clinic_schema_migrations WHERE version=?',['002_adopt_existing_clinic_schema.sql']);if(adoption.length)throw new Error(`Existe una reconciliación 002 (${String(adoption[0].state)}); no corresponde ejecutar nuevamente el SQL histórico 001_connected_clinic.sql.`);}
 await c.execute("CREATE TABLE IF NOT EXISTS clinic_schema_migrations(version VARCHAR(100) PRIMARY KEY,checksum CHAR(64) NOT NULL,completed_steps INT UNSIGNED NOT NULL DEFAULT 0,state ENUM('running','applied') NOT NULL)");
 const version='001_connected_clinic.sql';const [existing]=await c.execute<RowDataPacket[]>('SELECT checksum,completed_steps,state FROM clinic_schema_migrations WHERE version=?',[version]);
 if(existing[0]&&existing[0].checksum!==checksum)throw new Error('La migración cambió después de iniciarse.');if(existing[0]?.state==='applied'){console.log('Ampliación ya aplicada.');return;}
 if(existing[0]?.state==='running')throw new Error('Aplicación interrumpida: revisar completed_steps y esquema antes de reanudar manualmente; no se repiten transformaciones de stock.');
 const [present]=await c.execute<RowDataPacket[]>("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='professional_types'");if(present.length)throw new Error('El esquema ya tiene esta ampliación sin registro del runner; no repetir el SQL manual.');
 await c.execute("INSERT INTO clinic_schema_migrations(version,checksum,state) VALUES (?,?,'running')",[version,checksum]);
 for(let step=0;step<statements.length;step++){await c.query(statements[step]);await c.execute('UPDATE clinic_schema_migrations SET completed_steps=? WHERE version=?',[step+1,version]);}
 await c.execute("UPDATE clinic_schema_migrations SET state='applied' WHERE version=?",[version]);console.log('Ampliación aplicada sin registros de demostración.');
 });}finally{c.release();await databasePool.end();}}
void main().catch((error: unknown)=>{
 const cause=error instanceof Error?error.message:String(error);
 console.error(`No se completó la migración clínica: ${cause}`);
 process.exitCode=1;
});
