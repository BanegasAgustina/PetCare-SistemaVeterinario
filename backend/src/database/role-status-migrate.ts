/** Adds persisted role state without applying it implicitly during startup. */
import { databasePool } from '../config/database';
import type { RowDataPacket } from 'mysql2/promise';

/** Idempotent local migration; invoke explicitly after reviewing the target database. */
async function migrateRoleStatus(){
  const [columns]=await databasePool.query<RowDataPacket[]>(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles' AND COLUMN_NAME='is_active'",
  );
  if(!columns.length)await databasePool.query('ALTER TABLE roles ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1');
  console.info(JSON.stringify({event:'role_status_migration_complete',changed:columns.length===0}));
}

void migrateRoleStatus().catch(error=>{console.error('Role status migration failed.',error instanceof Error?error.name:'UnknownError');process.exitCode=1;}).finally(()=>databasePool.end());
