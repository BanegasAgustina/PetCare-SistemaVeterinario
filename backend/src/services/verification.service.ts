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

export const hashVerificationToken = (token: string) => createHash('sha256').update(token).digest('hex');
export const hashVerificationCode = (id: string, code: string) => createHmac('sha256', getVerificationSecret()).update(`${id}:${code}`).digest('hex');
const sameHash = (a: string, b: string) => timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
function challenge(token: string, row: VerificationRow): VerificationChallenge {
  return { verificationToken: token, maskedEmail: maskEmail(row.email), retryAfterSeconds: Number(row.retry_seconds),
    expiresAt: row.expires_at ? `${row.expires_at.replace(' ', 'T')}Z` : null, delivery: row.delivery };
}
function requireProof(row: VerificationRow | null, tokenHash: string): asserts row is VerificationRow {
  if (!row || !sameHash(row.token_hash, tokenHash) || Number(row.proof_expired) === 1) {
    throw new AppError('VERIFICATION_SESSION_EXPIRED', 401, 'Volvé a iniciar sesión para retomar la verificación.');
  }
  if (row.email_verified_at || row.consumed_at) throw new AppError('EMAIL_ALREADY_VERIFIED', 409, 'Tu correo ya está verificado. Podés iniciar sesión.');
}

/** El token de 256 bits solo se entrega tras crear cuenta o comprobar su contraseña. */
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

export async function verifyEmail(body: unknown): Promise<void> {
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
}
