/**
 * ARCHIVO: verification.service.ts
 * UBICACIÓN: backend/src/services/verification.service.ts
 * FUNCIÓN: Emisión, reenvío y comprobación de códigos de verificación de correo.
 * RESPONSABILIDAD: Genera desafíos con expiración y límites persistidos, almacena hashes/HMAC, 
 * envía por SMTP y consume la prueba antes de habilitar la sesión aplicable.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/config/mail.ts, backend/src/repositories/verification.repository.ts, backend/src/types/verification.ts, backend/src/utils/app-error.ts, backend/src/utils/database-error.ts, backend/src/utils/mask-email.ts, backend/src/validators/verification.validator.ts y 6 más Se utiliza desde: backend/src/controllers/verification.controller.ts, backend/src/services/auth.service.ts, backend/src/services/oauth.service.ts
 * FUNCIONAMIENTO: auth/oauth services y verification.controller → este servicio → verification.repository, mail.service, session.service y oauth-policy.
 * IMPORTANCIA: Confirma posesión del correo con códigos de un solo uso sin guardar el código en claro.
 */
/** Código de seis dígitos, HMAC con secreto, expiración y límites persistidos; sin JWT de acceso. */
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { databasePool } from '../config/database';
import { getMailConfiguration, getVerificationSecret } from '../config/mail';
import { findVerificationUser, readVerification, withVerificationUser, type VerificationRow } from '../repositories/verification.repository';
import type { VerificationChallenge } from '../types/verification';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
import { maskEmail } from '../utils/mask-email';
import { validateVerification } from '../validators/verification.validator';
import { sendVerificationEmail } from './mail.service';
import { registerStage, registerDiagnosticFailure } from '../utils/register-diagnostics';
import { findUserById } from '../repositories/user.repository';
import { sessionForUser } from './session.service';
import { shouldIssueSessionAfterVerification } from './oauth-policy';
import type { AccessSession } from '../types/auth';
import type { RowDataPacket } from 'mysql2/promise';

/** Calcula la huella SHA-256 del token aleatorio de verificación. */
export const hashVerificationToken = (token: string) => createHash('sha256').update(token).digest('hex');
/** Genera HMAC del identificador y código con el secreto del servidor. */
export const hashVerificationCode = (id: string, code: string) => createHmac('sha256', getVerificationSecret()).update(`${id}:${code}`).digest('hex');
/** Compara hashes en tiempo constante para reducir filtraciones por diferencias de tiempo. */
const sameHash = (a: string, b: string) => timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
/** Construye la respuesta pública de desafío con los datos almacenados y el token que debe conservar el cliente. */
function challenge(token: string, row: VerificationRow): VerificationChallenge {
  return { verificationToken: token, maskedEmail: maskEmail(row.email), retryAfterSeconds: Number(row.retry_seconds),
    expiresAt: row.expires_at ? `${row.expires_at.replace(' ', 'T')}Z` : null, delivery: row.delivery };
}
/** Exige una prueba existente, no vencida ni consumida, y detiene el flujo con error uniforme si no se cumple. */
function requireProof(row: VerificationRow | null, tokenHash: string): asserts row is VerificationRow {
  if (!row || !sameHash(row.token_hash, tokenHash) || Number(row.proof_expired) === 1) {
    throw new AppError('VERIFICATION_SESSION_EXPIRED', 401, 'Volvé a iniciar sesión para retomar la verificación.');
  }
  if (row.email_verified_at || row.consumed_at) throw new AppError('EMAIL_ALREADY_VERIFIED', 409, 'Tu correo ya está verificado. Podés iniciar sesión.');
}

/** El token de 256 bits solo se entrega tras crear cuenta o comprobar su contraseña. */
/** Crea y persiste una prueba aleatoria con expiración para el identificador recibido. */
export async function createVerificationProof(id: string): Promise<VerificationChallenge> {
  getVerificationSecret();
  const token = randomBytes(32).toString('hex');
  return withVerificationUser(id, async (connection, user) => {
    if (user.email_verified_at) throw new AppError('EMAIL_ALREADY_VERIFIED', 409, 'Tu correo ya está verificado. Podés iniciar sesión.');
    const row = await readVerification(connection, id);
    if (!row) {
      await connection.execute(`INSERT INTO email_verifications (user_id, token_hash, proof_expires_at, send_window_started_at, next_send_at, delivery)
        VALUES (?, ?, TIMESTAMPADD(HOUR, 24, UTC_TIMESTAMP(3)), UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), 'failed')`, [id, hashVerificationToken(token)]);
    } else {
      // Rotar la prueba no reinicia intentos ni límites de envío y no otorga acceso a la cuenta.
      await connection.execute('UPDATE email_verifications SET token_hash = ?, proof_expires_at = TIMESTAMPADD(HOUR, 24, UTC_TIMESTAMP(3)) WHERE user_id = ?', [hashVerificationToken(token), id]);
    }
    return challenge(token, (await readVerification(connection, id))!);
  });
}

/** Aplica límites y reserva un código nuevo antes de enviar; persiste el resultado de entrega sin revelar la cuenta. */
export async function resendVerification(body: unknown): Promise<VerificationChallenge> {
  const { verificationToken: token } = validateVerification(body, false);
  getMailConfiguration(); getVerificationSecret();
  const tokenHash = hashVerificationToken(token);
  const id = await findVerificationUser(tokenHash);
  registerStage('verification_code_reservation');
  const reservation = await withVerificationUser(id, async (connection) => {
    const row = await readVerification(connection, id); requireProof(row, tokenHash);
    if (Number(row.retry_seconds) > 0) throw new AppError('VERIFICATION_COOLDOWN', 429, 'Esperá unos segundos antes de reenviar.', challenge(token, row));
    // mysql2 entrega algunas expresiones booleanas como BIGINT string ("0" no es falsy).
    const windowExpired = Number(row.window_expired) === 1;
    const count = windowExpired ? 0 : row.send_count;
    if (count >= 5) throw new AppError('VERIFICATION_SEND_LIMIT', 429, 'Alcanzaste el límite de envíos. Intentá dentro de una hora.', { ...challenge(token, row), retryAfterSeconds: Number(row.window_seconds) });
    let code: string; let codeHash: string;
    do { code = String(randomInt(0, 1000000)).padStart(6, '0'); codeHash = hashVerificationCode(id, code); }
    while (row.code_hash && sameHash(codeHash, row.code_hash));
    // Reserva antes de SMTP: incluso un envío fallido consume cuota para impedir abuso.
    await connection.execute(`UPDATE email_verifications SET code_hash = ?, expires_at = TIMESTAMPADD(MINUTE, 10, UTC_TIMESTAMP(3)),
      attempts = 0, send_count = ?, send_window_started_at = CASE WHEN ? THEN UTC_TIMESTAMP(3) ELSE send_window_started_at END,
      next_send_at = TIMESTAMPADD(SECOND, 45, UTC_TIMESTAMP(3)), delivery = 'pending' WHERE user_id = ?`, [codeHash, count + 1, windowExpired, id]);
    return { code, codeHash, email: row.email };
  });
  registerStage('verification_code_persisted');
  let delivered = true;
  registerStage('sending_verification_email');
  try { await sendVerificationEmail(reservation.email, reservation.code); } catch (error) {
    registerDiagnosticFailure(error);
    if (!(error instanceof AppError) || error.code !== 'EMAIL_DELIVERY_FAILED') throw error;
    delivered = false;
  }
  registerStage(delivered ? 'verification_email_sent' : 'verification_email_failed');
  await runDatabaseOperation(() => databasePool.execute(`UPDATE email_verifications SET delivery = ?,
    code_hash = CASE WHEN ? THEN code_hash ELSE NULL END, expires_at = CASE WHEN ? THEN expires_at ELSE NULL END
    WHERE user_id = ? AND code_hash = ?`, [delivered ? 'sent' : 'failed', delivered, delivered, id, reservation.codeHash]));
  registerStage('verification_delivery_persisted');
  return withVerificationUser(id, async connection => {
    const row = await readVerification(connection, id); requireProof(row, tokenHash);
    return challenge(token, row);
  });
}

/** Valida desafío/código de un solo uso, actualiza verificación y solo crea sesión cuando la política permite hacerlo. */
export async function verifyEmail(body: unknown): Promise<AccessSession | null> {
  const { verificationToken: token, code } = validateVerification(body, true);
  const tokenHash = hashVerificationToken(token);
  const id = await findVerificationUser(tokenHash);
  const error = await withVerificationUser(id, async connection => {
    const row = await readVerification(connection, id); requireProof(row, tokenHash);
    if (Number(row.code_expired) === 1 || !row.code_hash) return new AppError('VERIFICATION_CODE_EXPIRED', 410, 'El código venció. Solicitá uno nuevo.');
    if (row.attempts >= 5) return new AppError('VERIFICATION_ATTEMPTS_EXCEEDED', 429, 'Alcanzaste el límite de intentos. Solicitá un código nuevo.');
    if (!sameHash(row.code_hash, hashVerificationCode(id, code!))) {
      await connection.execute('UPDATE email_verifications SET attempts = attempts + 1 WHERE user_id = ?', [id]);
      // Se devuelve el error y se confirma la transacción antes de lanzarlo: el intento no se revierte.
      return new AppError('VERIFICATION_CODE_INVALID', 400, 'El código ingresado no es correcto.');
    }
    await connection.execute('UPDATE users SET email_verified_at = UTC_TIMESTAMP(3) WHERE id = ?', [id]);
    await connection.execute('UPDATE email_verifications SET consumed_at = UTC_TIMESTAMP(3), code_hash = NULL WHERE user_id = ?', [id]);
    return null;
  });
  if (error) throw error;
  const [accounts]=await databasePool.execute<RowDataPacket[]>('SELECT user_id FROM oauth_accounts WHERE user_id=? LIMIT 1',[id]);
  if(!shouldIssueSessionAfterVerification(accounts.length>0))return null;
  const user=await findUserById(id);
  if(!user||!user.isActive||!user.emailVerifiedAt)throw new AppError('VERIFICATION_SESSION_EXPIRED',401,'La cuenta no está disponible. Iniciá sesión para continuar.');
  return sessionForUser(user);
}
