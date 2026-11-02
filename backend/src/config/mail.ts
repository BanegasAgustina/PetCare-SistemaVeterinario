/**
 * ARCHIVO: mail.ts
 * UBICACIÓN: backend/src/config/mail.ts
 * FUNCIÓN: Valida parámetros SMTP y el secreto HMAC de verificación de correo.
 * RESPONSABILIDAD: Habilitar correo saliente seguro solo cuando sus parámetros están completos y consistentes.
 * CONEXIONES: Importa: backend/src/config/env.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/repositories/notification.repository.ts, backend/src/services/auth.service.ts, backend/src/services/invitation.service.ts, backend/src/services/mail.service.ts, backend/src/services/oauth.service.ts, backend/src/services/password-reset.service.ts, backend/src/services/verification.service.ts
 * FUNCIONAMIENTO: getMailConfiguration valida host, dirección, puerto, TLS y credenciales; getVerificationSecret comprueba longitud del secreto.
 * IMPORTANCIA: Invitaciones, recuperación y verificación consultan estos proveedores de configuración bajo demanda.
 */
/** Configuración SMTP diferida; health y migraciones no requieren un servidor de correo. */
import isEmail from 'validator/lib/isEmail';
import { env } from './env';
import { AppError } from '../utils/app-error';

/** Construye las opciones SMTP; los secretos quedan en entorno y no se exportan al cliente. */
export function getMailConfiguration() {
  const host = process.env.SMTP_HOST?.trim() ?? '';
  const from = process.env.MAIL_FROM?.trim() ?? '';
  const port = Number(process.env.SMTP_PORT ?? 587);
  const secure = process.env.SMTP_SECURE === 'true';
  const requireTLS = process.env.SMTP_REQUIRE_TLS !== 'false';
  const user = process.env.SMTP_USER ?? '';
  const pass = process.env.SMTP_PASSWORD ?? '';
  const insecureLocalTest = env.nodeEnvironment === 'test' && ['127.0.0.1', 'localhost', '::1'].includes(host);
  if (!host || !isEmail(from) || /[\r\n]/.test(from) || !Number.isInteger(port) || port < 1 || port > 65535 ||
    (!secure && !requireTLS && !insecureLocalTest) || Boolean(user) !== Boolean(pass)) {
    throw new AppError('EMAIL_UNAVAILABLE', 503, 'El envío de correo no está disponible. Intentá más tarde.');
  }
  return { host, port, secure, requireTLS, from, auth: user ? { user, pass } : undefined };
}

/** HMAC evita que un volcado de DB permita probar offline el millón de códigos posibles. */
/** Devuelve el secreto HMAC solo si tiene entropía mínima configurada. */
export function getVerificationSecret(): string {
  const secret = process.env.EMAIL_CODE_SECRET ?? '';
  if (Buffer.byteLength(secret, 'utf8') < 32 || secret.trim().length < 32) {
    throw new AppError('EMAIL_UNAVAILABLE', 503, 'La verificación de correo no está disponible. Intentá más tarde.');
  }
  return secret;
}
