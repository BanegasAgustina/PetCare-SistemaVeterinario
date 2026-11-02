/**
 * ARCHIVO: database.service.ts
 * UBICACIÓN: backend/src/services/database.service.ts
 * FUNCIÓN: Comprobación de disponibilidad y versiones admitidas de MySQL/MariaDB.
 * RESPONSABILIDAD: Consulta VERSION() y estado de conexión, aplica la política explícita de compatibilidad y normaliza fallos de base de datos.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/controllers/database-health.controller.ts, backend/src/database/bootstrap.ts, backend/src/database/cli.ts, backend/src/database/client-reference-seed.ts, backend/src/database/create-database.ts, backend/src/database/migration-runner.ts, backend/src/database/seed-runner.ts
 * FUNCIONAMIENTO: Health/bootstrap/migration/seed y controladores → este servicio → databasePool y database-error.ts.
 * IMPORTANCIA: Evita iniciar o declarar saludable el backend con una versión de base no verificada.
 */
/** Comprobación centralizada de conectividad y compatibilidad con MySQL/MariaDB soportados. */
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';

/** Tipa las columnas devueltas por la consulta de estado y versión del motor. */
type VersionRow = RowDataPacket & { version: string; connection_status: number };

/** Acepta solo MySQL 8.0.16 o superior, MySQL 9.x y MariaDB 11.8.x; otras ramas generan error de disponibilidad. */
export function assertSupportedMysqlVersion(version: string): void {
  const normalized = version.trim();
  const maria = /^(\d+)\.(\d+)\.(\d+)(?:[-+.]|\s|$).*mariadb/i.exec(normalized);
  // La compatibilidad MariaDB está auditada y probada para la serie 11.8 LTS.
  // No aceptar otras ramas por compartir el protocolo: no están verificadas.
  const mariaSupported = maria && Number(maria[1]) === 11 && Number(maria[2]) === 8;
  const mysql = /^([89])\.(\d+)\.(\d+)/.exec(normalized);
  const mysqlSupported = mysql && !(Number(mysql[1]) === 8 && Number(mysql[2]) === 0 && Number(mysql[3]) < 16);
  if (!mariaSupported && !mysqlSupported) {
    throw new DatabaseError('DB_VERSION_UNSUPPORTED', 503, 'Se requiere MySQL 8.0.16+ / 9.x o MariaDB 11.8.x; otras versiones no están verificadas.');
  }
}
// Alias conserva los imports existentes sin cambiar contratos de creación de base.
/** Conserva el nombre de importación histórico como alias de la política vigente. */
export const assertMysql8Version = assertSupportedMysqlVersion;

/** Ejecuta una consulta real, valida conexión y versión soportada, y normaliza errores del driver. */
export async function checkDatabaseConnection(pool: Pool = databasePool): Promise<void> {
  await runDatabaseOperation(async () => {
    const [rows] = await pool.execute<VersionRow[]>('SELECT ? AS connection_status, VERSION() AS version', [1]);
    if (rows[0]?.connection_status !== 1) throw new DatabaseError('DB_UNAVAILABLE', 503, 'La base de datos no está disponible.');
    assertSupportedMysqlVersion(rows[0].version);
  });
}
