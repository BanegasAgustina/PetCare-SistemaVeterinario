/** Configuración SMTP diferida; health y migraciones no requieren un servidor de correo. */
import isEmail from 'validator/lib/isEmail';
import { env } from './env';
import { AppError } from '../utils/app-error';

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
export function getVerificationSecret(): string {
  const secret = process.env.EMAIL_CODE_SECRET ?? '';
  if (Buffer.byteLength(secret, 'utf8') < 32 || secret.trim().length < 32) {
    throw new AppError('EMAIL_UNAVAILABLE', 503, 'La verificación de correo no está disponible. Intentá más tarde.');
  }
  return secret;
}
