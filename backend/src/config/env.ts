// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Carga y valida la configuración antes de iniciar el servidor. Nunca contiene secretos. */
import 'dotenv/config';
import { AppError } from '../utils/app-error';

// Función readPort: obtiene o consulta información dentro de este módulo.
function readPort(name: string, fallback: number): number {
  const rawValue = process.env[name];
  const value = rawValue === undefined ? fallback : Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`La variable ${name} debe ser un puerto válido.`);
  }
  return value;
}

/** Límites explícitos impiden pools excesivos y tiempos de conexión sin control. */
// Función readPositiveInteger: obtiene o consulta información dentro de este módulo.
function readPositiveInteger(name: string, fallback: number, maximum: number): number {
  const value = process.env[name] === undefined ? fallback : Number(process.env[name]);
  if (!Number.isInteger(value) || value < 1 || value > maximum) {
    throw new Error(`La variable ${name} debe ser un entero positivo hasta ${maximum}.`);
  }
  return value;
}

// Función readBoolean: obtiene o consulta información dentro de este módulo.
function readBoolean(name:string,fallback:boolean):boolean{
  const raw=process.env[name];
  if(raw===undefined)return fallback;
  if(['1','true','yes'].includes(raw.trim().toLowerCase()))return true;
  if(['0','false','no'].includes(raw.trim().toLowerCase()))return false;
  throw new Error(`${name} debe ser true o false.`);
}

// Dato databaseName: conserva un valor calculado o de configuración usado por este módulo.
const databaseName = process.env.DB_NAME ?? 'petcare';
// Los identificadores SQL no aceptan placeholders: el nombre usa una lista permitida estricta.
if (!/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/.test(databaseName)) {
  throw new Error('DB_NAME debe comenzar con una letra y contener solo letras, números o guiones bajos (máximo 64).');
}

// Dato isVercelRuntime: conserva un valor calculado o de configuración usado por este módulo.
export const isVercelRuntime = Boolean(process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_REGION || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
// Dato nodeEnvironment: conserva un valor calculado o de configuración usado por este módulo.
const nodeEnvironment = process.env.NODE_ENV ?? (isVercelRuntime ? 'production' : 'development');
if (!['development', 'test', 'production'].includes(nodeEnvironment)) {
  throw new Error('NODE_ENV debe ser development, test o production.');
}

// Dato configuredDatabaseHost: conserva un valor calculado o de configuración usado por este módulo.
const configuredDatabaseHost = process.env.DB_HOST?.trim();
// Dato databaseHost: conserva un valor calculado o de configuración usado por este módulo.
const databaseHost = configuredDatabaseHost || (nodeEnvironment === 'production' ? '' : '127.0.0.1');
if (!databaseHost) {
  throw new Error('DB_HOST es obligatorio en production; configurá el host remoto de la base de datos.');
}
if (nodeEnvironment === 'production' && /^(localhost|127(?:\.\d{1,3}){0,3}|::1|\[::1\]|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2})$/i.test(databaseHost)) {
  throw new Error('DB_HOST no puede apuntar a loopback o a una IP de red local en production.');
}
if (nodeEnvironment === 'production' && (!process.env.DB_USER?.trim() || !process.env.DB_PASSWORD)) {
  throw new Error('DB_USER y DB_PASSWORD son obligatorios en production.');
}
if (/(?:^|\.)(?:railway\.internal|rlwy\.net|railway\.app)$/i.test(databaseHost)) {
  throw new Error('DB_HOST todavía apunta a Railway. Configurá el host vigente de Layerbase en DB_HOST.');
}
// Dato isLayerbaseHost: conserva un valor calculado o de configuración usado por este módulo.
const isLayerbaseHost = /layerbase/i.test(databaseHost);
// Dato databaseSslMode: conserva un valor calculado o de configuración usado por este módulo.
const databaseSslMode = (process.env.DB_SSL_MODE ?? (isLayerbaseHost || nodeEnvironment === 'production' ? 'required' : 'disabled')).toLowerCase();
if (!['disabled', 'required', 'verify_identity'].includes(databaseSslMode)) {
  throw new Error('DB_SSL_MODE debe ser disabled, required o verify_identity.');
}
if (databaseSslMode === 'disabled' && (isLayerbaseHost || nodeEnvironment === 'production')) {
  throw new Error('La conexión remota/producción requiere TLS. Configurá DB_SSL_MODE=required o verify_identity.');
}

// Los orígenes locales solo aplican en desarrollo/pruebas; production admite la web oficial.
// Configuración localWebOrigins: reúne valores o reglas que consume el resto del módulo.
const localWebOrigins = [
  'http://localhost:8081',
  'http://127.0.0.1:8081',
  'http://localhost:8082',
  'http://127.0.0.1:8082',
];
// Configuración petcareWebOrigins: reúne valores o reglas que consume el resto del módulo.
const petcareWebOrigins = [
  'https://petcare-sistemaveterinario-mobile.vercel.app',
];
// Dato petcareVercelPreviewOrigin: conserva un valor calculado o de configuración usado por este módulo.
const petcareVercelPreviewOrigin = /^https:\/\/petcare-sistemaveterinario-mobile-[a-z0-9-]+\.vercel\.app$/;
// Dato configuredCorsOrigins: conserva un valor calculado o de configuración usado por este módulo.
const configuredCorsOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
if (nodeEnvironment === 'production') {
  for (const origin of configuredCorsOrigins) {
    try {
      const url = new URL(origin);
      if (url.protocol !== 'https:' || url.origin !== origin || url.username || url.password) throw new Error();
    } catch {
      throw new Error('CORS_ALLOWED_ORIGINS en production debe contener solo origenes HTTPS exactos, sin rutas ni credenciales.');
    }
  }
}

// Configuración env: reúne valores o reglas que consume el resto del módulo.
export const env = {
  nodeEnvironment,
  port: readPort('PORT', 3000),
  database: {
    host: databaseHost,
    port: readPort('DB_PORT', 3306),
    database: databaseName,
    user: process.env.DB_USER ?? 'petcare',
    password: process.env.DB_PASSWORD ?? '',
    ssl: databaseSslMode === 'disabled' ? undefined : databaseSslMode === 'verify_identity' ? { verifyIdentity: true } : { rejectUnauthorized: false },
  },
  // Cada instancia serverless conserva su propio pool; un pool de 5 multiplicado
  // por la concurrencia de Vercel puede agotar el límite de Layerbase.
  databaseConnectionLimit: readPositiveInteger('DB_CONNECTION_LIMIT', isVercelRuntime ? 1 : 5, isVercelRuntime ? 10 : 100),
  databaseQueueLimit: isVercelRuntime ? 10 : 50,
  databaseConnectTimeout: readPositiveInteger('DB_CONNECT_TIMEOUT_MS', 30000, 60000),
  bcryptSaltRounds: readPositiveInteger('BCRYPT_SALT_ROUNDS', 12, 14),
  // Los pedidos ficticios solo se habilitan con una decisión explícita del operador.
  storeDemoEnabled: readBoolean('STORE_DEMO_MODE', false),
  corsAllowedOrigins: [...new Set([...(nodeEnvironment === 'production' ? [] : localWebOrigins), ...petcareWebOrigins, ...configuredCorsOrigins])],
  isCorsOriginAllowed: (origin?: string) => !origin || env.corsAllowedOrigins.includes(origin) || petcareVercelPreviewOrigin.test(origin),
};

if (env.bcryptSaltRounds < 10) throw new Error('BCRYPT_SALT_ROUNDS debe estar entre 10 y 14.');

/** Validación diferida: health y comandos DB siguen funcionando sin una clave JWT configurada. */
// Función getJwtConfiguration: obtiene o consulta información dentro de este módulo.
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
