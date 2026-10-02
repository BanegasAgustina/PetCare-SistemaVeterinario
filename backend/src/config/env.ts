/** Carga y valida la configuración antes de iniciar el servidor. Nunca contiene secretos. */
import 'dotenv/config';
import { AppError } from '../utils/app-error';

function readPort(name: string, fallback: number): number {
  const rawValue = process.env[name];
  const value = rawValue === undefined ? fallback : Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`La variable ${name} debe ser un puerto válido.`);
  }
  return value;
}

/** Límites explícitos impiden pools excesivos y tiempos de conexión sin control. */
function readPositiveInteger(name: string, fallback: number, maximum: number): number {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`La variable ${name} debe ser un entero positivo hasta ${maximum}.`);
  }
  return value;
}

const databaseName = process.env.DB_NAME ?? 'petcare';
// Los identificadores SQL no aceptan placeholders: el nombre usa una lista permitida estricta.
if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(databaseName)) {
  throw new Error('DB_NAME debe comenzar con una letra y contener solo letras, números o guiones bajos (máximo 64).');
}

const nodeEnvironment = process.env.NODE_ENV ?? 'development';
if (!['development', 'test', 'production'].includes(nodeEnvironment)) {
  throw new Error('NODE_ENV debe ser development, test o production.');
}

export const env = {
  nodeEnvironment,
  port: readPort('PORT', 3000),
  database: {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: readPort('DB_PORT', 3306),
    database: databaseName,
    user: process.env.DB_USER ?? 'petcare',
    password: process.env.DB_PASSWORD ?? '',
  },
  databaseConnectionLimit: readPositiveInteger('DB_CONNECTION_LIMIT', 10, 100),
  databaseConnectTimeout: readPositiveInteger('DB_CONNECT_TIMEOUT_MS', 5000, 60000),
  bcryptSaltRounds: readPositiveInteger('BCRYPT_SALT_ROUNDS', 12, 14),
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean),
};

if (env.bcryptSaltRounds < 10) throw new Error('BCRYPT_SALT_ROUNDS debe estar entre 10 y 14.');

/** Validación diferida: health y comandos DB siguen funcionando sin una clave JWT configurada. */
export function getJwtConfiguration() {
  const secret = process.env.JWT_ACCESS_SECRET ?? '';
  const issuer = process.env.JWT_ISSUER ?? 'petcare-api';
  const audience = process.env.JWT_AUDIENCE ?? 'petcare-mobile';
  const expiresIn = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);
  if (Buffer.byteLength(secret, 'utf8') < 32 || secret.trim().length < 32 ||
    !issuer.trim() || !audience.trim() || !Number.isInteger(expiresIn) || expiresIn < 1 || expiresIn > 3600) {
    throw new AppError('AUTH_UNAVAILABLE', 503, 'El inicio de sesión no está disponible. Intentá más tarde.');
  }
  return {
    secret,
    issuer,
    audience,
    expiresIn,
  };
}
