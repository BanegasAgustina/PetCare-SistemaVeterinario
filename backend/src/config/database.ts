// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; 
// reúne declaraciones y operaciones relacionadas con su módulo.

/** Pool MySQL compartido: las futuras consultas usarán execute(sql, parámetros). */
import mysql, { type ConnectionOptions } from 'mysql2/promise';
import { env } from './env';

// Crear el pool no abre conexiones: health puede funcionar sin una base instalada.
/** Opciones compartidas por el pool y la creación inicial de la base. */
// Configuración databaseOptions: reúne valores o reglas que consume el resto del módulo.
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

// Dato databasePool: conserva un valor calculado o de configuración usado por este módulo.
export const databasePool = mysql.createPool({
  ...databaseOptions,
  waitForConnections: true,
  connectionLimit: env.databaseConnectionLimit,
  queueLimit: env.databaseQueueLimit,
});

// UTC mantiene alineados TIMESTAMP, UTC_TIMESTAMP y los vencimientos persistidos por la aplicación.
databasePool.on('connection', connection => {
  const promiseConnection = (connection as unknown as {
    promise(): { query(sql: string): Promise<unknown> };
  }).promise();
  void promiseConnection.query("SET time_zone = '+00:00'").catch(() => {
    console.error('No se pudo fijar UTC en una conexión MySQL.');connection.destroy();
  });
});
