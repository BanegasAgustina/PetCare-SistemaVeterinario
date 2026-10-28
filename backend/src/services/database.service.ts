// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

/** Comprobación centralizada de conectividad y compatibilidad con MySQL/MariaDB soportados. */
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';

// Tipo VersionRow: define la forma o las opciones válidas de datos usados por este módulo.
type VersionRow = RowDataPacket & { version: string; connection_status: number };

// Función assertSupportedMysqlVersion: comprueba una regla o condición dentro de este módulo.
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
// Dato assertMysql8Version: conserva un valor calculado o de configuración usado por este módulo.
export const assertMysql8Version = assertSupportedMysqlVersion;

// Función checkDatabaseConnection: comprueba una regla o condición dentro de este módulo.
export async function checkDatabaseConnection(pool: Pool = databasePool): Promise<void> {
  await runDatabaseOperation(async () => {
    const [rows] = await pool.execute<VersionRow[]>('SELECT ? AS connection_status, VERSION() AS version', [1]);
    if (rows[0]?.connection_status !== 1) throw new DatabaseError('DB_UNAVAILABLE', 503, 'La base de datos no está disponible.');
    assertSupportedMysqlVersion(rows[0].version);
  });
}
