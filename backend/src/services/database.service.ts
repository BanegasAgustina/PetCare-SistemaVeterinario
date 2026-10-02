/** Comprobación centralizada de conectividad y compatibilidad con MySQL 8/9. */
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';

type VersionRow = RowDataPacket & { version: string; connection_status: number };

export function assertSupportedMysqlVersion(version: string): void {
  const match = /^([89])\.(\d+)\.(\d+)/.exec(version);
  // CHECK se aplica realmente desde MySQL 8.0.16; MariaDB y otras versiones se rechazan.
  if (!match || version.toLowerCase().includes('mariadb') || (Number(match[1]) === 8 && Number(match[2]) === 0 && Number(match[3]) < 16)) {
    throw new DatabaseError('DB_VERSION_UNSUPPORTED', 503, 'La base de datos requiere MySQL 8.0.16 o posterior de las ramas 8/9.');
  }
}
// Alias conserva los imports existentes sin cambiar contratos de creación de base.
export const assertMysql8Version = assertSupportedMysqlVersion;

export async function checkDatabaseConnection(pool: Pool = databasePool): Promise<void> {
  await runDatabaseOperation(async () => {
    const [rows] = await pool.execute<VersionRow[]>('SELECT ? AS connection_status, VERSION() AS version', [1]);
    if (rows[0]?.connection_status !== 1) throw new DatabaseError('DB_UNAVAILABLE', 503, 'La base de datos no está disponible.');
    assertSupportedMysqlVersion(rows[0].version);
  });
}
