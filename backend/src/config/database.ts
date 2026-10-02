/** Pool MySQL compartido: las futuras consultas usarán execute(sql, parámetros). */
import mysql, { type ConnectionOptions } from 'mysql2/promise';
import { env } from './env';

// Crear el pool no abre conexiones: health puede funcionar sin una base instalada.
/** Opciones compartidas por el pool y la creación inicial de la base. */
export const databaseOptions: ConnectionOptions = {
  ...env.database,
  connectTimeout: env.databaseConnectTimeout,
  multipleStatements: false,
  charset: 'utf8mb4',
  timezone: 'Z',
  dateStrings: true,
  // BIGINT puede exceder Number.MAX_SAFE_INTEGER; los IDs se leen como strings.
  supportBigNumbers: true,
  bigNumberStrings: true,
};

export const databasePool = mysql.createPool({
  ...databaseOptions,
  waitForConnections: true,
  connectionLimit: env.databaseConnectionLimit,
  queueLimit: 50,
});
