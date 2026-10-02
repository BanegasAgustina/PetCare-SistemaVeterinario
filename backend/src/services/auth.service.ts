/** Registro con bcrypt y login sin distinguir públicamente cuenta inexistente de contraseña incorrecta. */
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { env, getJwtConfiguration } from '../config/env';
import { createClientUser, findUserByEmail, publicUser } from '../repositories/user.repository';
import type { AccessSession, AuthUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import { validateLogin, validateRegister } from '../validators/auth.validator';
import { createAccessToken } from './token.service';
import { getMailConfiguration, getVerificationSecret } from '../config/mail';
import { createVerificationProof, hashVerificationToken, resendVerification } from './verification.service';
import type { VerificationChallenge } from '../types/verification';
import { authorizationData } from '../repositories/authorization.repository';
import { registerStage } from '../utils/register-diagnostics';

let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
  // Se calcula una vez a partir de datos aleatorios; también se compara bcrypt cuando no hay usuario.
  dummyHash ??= bcrypt.hash(randomBytes(32).toString('hex'), env.bcryptSaltRounds);
  return dummyHash;
}

export async function registerUser(body: unknown): Promise<{ user: AuthUser; verification: VerificationChallenge }> {
  registerStage('validation');
  const input = validateRegister(body);
  registerStage('validation_ok');
  registerStage('mail_configuration');
  getMailConfiguration(); getVerificationSecret();
  registerStage('mail_configuration_ok');
  registerStage('checking_existing_email');
  if (await findUserByEmail(input.email)) throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'Ya existe una cuenta con ese email.');
  registerStage('existing_email_checked');
  registerStage('password_hashing');
  const passwordHash = await bcrypt.hash(input.password, env.bcryptSaltRounds);
  registerStage('password_hashed');
  const verificationToken = randomBytes(32).toString('hex');
  const user = await createClientUser(input, passwordHash, hashVerificationToken(verificationToken));
  const verification = await resendVerification({ verificationToken });
  return { user, verification };
}

export async function loginUser(body: unknown): Promise<AccessSession> {
  const input = validateLogin(body);
  getJwtConfiguration();
  const fallbackHash = await getDummyHash();
  const user = await findUserByEmail(input.email);
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? fallbackHash);
  if (!user || !user.isActive || !passwordMatches) throw new AppError('INVALID_CREDENTIALS', 401, 'Email o contraseña incorrectos.');
  if (!user.emailVerifiedAt) throw new AppError('EMAIL_NOT_VERIFIED', 403, 'Tu correo todavía no está verificado.', await createVerificationProof(user.id));
  return { user: { ...publicUser(user), ...await authorizationData(user.id) }, ...createAccessToken(user.id, user.sessionVersion), tokenType: 'Bearer' };
}
