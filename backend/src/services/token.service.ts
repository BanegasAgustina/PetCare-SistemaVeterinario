/** Firma y verifica Access Tokens; identidad y permisos reales se consultan en la base. */
import jwt from 'jsonwebtoken';
import { getJwtConfiguration } from '../config/env';
import { AppError } from '../utils/app-error';

export function createAccessToken(userId: string, sessionVersion = 0): { accessToken: string; expiresIn: number } {
  const config = getJwtConfiguration();
  const accessToken = jwt.sign({ sessionVersion }, config.secret, { algorithm: 'HS256', subject: userId, issuer: config.issuer, audience: config.audience, expiresIn: config.expiresIn });
  return { accessToken, expiresIn: config.expiresIn };
}

/** Solo leer la versión después de verificar firma/issuer/audience con verifyAccessToken. */
export function accessTokenSessionVersion(token: string): number {
  const payload = jwt.decode(token);
  if (!payload || typeof payload === 'string') return -1;
  return payload.sessionVersion === undefined ? 0 : Number.isSafeInteger(payload.sessionVersion) ? payload.sessionVersion : -1;
}

export function verifyAccessToken(token: string): string {
  const config = getJwtConfiguration();
  try {
    const payload = jwt.verify(token, config.secret, { algorithms: ['HS256'], issuer: config.issuer, audience: config.audience });
    if (typeof payload === 'string' || typeof payload.exp !== 'number' || typeof payload.iat !== 'number' ||
      typeof payload.sub !== 'string' || !/^[1-9]\d{0,19}$/.test(payload.sub) || BigInt(payload.sub) > 18446744073709551615n) {
      throw new AppError('INVALID_TOKEN', 401, 'La sesión no es válida. Iniciá sesión nuevamente.');
    }
    return payload.sub;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) throw new AppError('TOKEN_EXPIRED', 401, 'Tu sesión venció. Iniciá sesión nuevamente.');
    throw new AppError('INVALID_TOKEN', 401, 'La sesión no es válida. Iniciá sesión nuevamente.');
  }
}
