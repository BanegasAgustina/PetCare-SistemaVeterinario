/**
 * ARCHIVO: auth.service.ts
 * UBICACIÓN: backend/src/services/auth.service.ts
 * FUNCIÓN: Registro y autenticación local de usuarios mediante correo y contraseña.
 * RESPONSABILIDAD: Orquesta validación, búsqueda de cuentas, hashing, verificación de correo y creación de sesión; evita revelar si un correo existe durante el login.
 * CONEXIONES: Importa: backend/src/config/env.ts, backend/src/repositories/user.repository.ts, backend/src/types/auth.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/session.service.ts, backend/src/config/mail.ts, backend/src/services/verification.service.ts y 4 más Se utiliza desde: backend/src/controllers/auth.controller.ts
 * FUNCIONAMIENTO: auth.controller.ts → este servicio → user.repository, validators, mail/config y verification/session services → repositorios de usuarios y sesiones.
 * IMPORTANCIA: Es el límite de negocio entre las solicitudes de autenticación HTTP y los mecanismos de persistencia, correo y sesión.
 */
/** Registro con bcrypt y login sin distinguir públicamente cuenta inexistente de contraseña incorrecta. */
import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { env, getJwtConfiguration } from '../config/env';
import { createClientUser, findUserByEmail } from '../repositories/user.repository';
import type { AccessSession, AuthUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import { validateLogin, validateRegister } from '../validators/auth.validator';
import { sessionForUser } from './session.service';
import { getMailConfiguration, getVerificationSecret } from '../config/mail';
import { createVerificationProof, hashVerificationToken, resendVerification } from './verification.service';
import type { VerificationChallenge } from '../types/verification';
import { registerStage } from '../utils/register-diagnostics';
import { hashPassword } from './password.service';
import { isLoginAllowed } from '../utils/account-session-guards';

/** Hash ficticio reutilizado para comparar con bcrypt aunque no exista el correo. */
let dummyHash: Promise<string> | undefined;
/** Crea una sola promesa bcrypt de respaldo para que un email inexistente también ejecute una comparación costosa. */
function getDummyHash(): Promise<string> {
  // Se calcula una vez a partir de datos aleatorios; también se compara bcrypt cuando no hay usuario.
  dummyHash ??= bcrypt.hash(randomBytes(32).toString('hex'), env.bcryptSaltRounds);
  return dummyHash;
}

/** Crea CLIENT pendiente y prepara código SMTP; no emite sesión hasta verificar el email. */
/** Valida el alta pública CLIENT, comprueba email duplicado, guarda hash y crea verificación; no emite sesión antes de verificar el correo. */
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
  const passwordHash = await hashPassword(input.password);
  registerStage('password_hashed');
  const verificationToken = randomBytes(32).toString('hex');
  const user = await createClientUser(input, passwordHash, hashVerificationToken(verificationToken));
  const verification = await resendVerification({ verificationToken });
  return { user, verification };
}

/** Compara bcrypt incluso si la cuenta no existe para reducir diferencias de tiempo observables. */
/** Valida credenciales y políticas de cuenta; emite una sesión solo si la cuenta está activa, verificada y no requiere cambio inicial. */
export async function loginUser(body: unknown): Promise<AccessSession> {
  const input = validateLogin(body);
  getJwtConfiguration();
  const fallbackHash = await getDummyHash();
  const user = await findUserByEmail(input.email);
  const passwordMatches = await bcrypt.compare(input.password, user?.passwordHash ?? fallbackHash);
  if(!user||!isLoginAllowed({userExists:true,isActive:user.isActive,passwordMatches}))throw new AppError('INVALID_CREDENTIALS',401,'Correo electrónico o contraseña incorrectos.');
  if (!user.emailVerifiedAt) throw new AppError('EMAIL_NOT_VERIFIED', 403, 'Tu correo todavía no está verificado.', await createVerificationProof(user.id));
  if (user.mustChangePassword) throw new AppError('PASSWORD_CHANGE_REQUIRED',403,'Tenés que cambiar la contraseña inicial para continuar.');
  return sessionForUser(user);
}
