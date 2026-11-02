/**
 * ARCHIVO: password.service.ts
 * UBICACIÓN: backend/src/services/password.service.ts
 * FUNCIÓN: Hash común de contraseñas mediante bcrypt y el costo configurado por el backend.
 * RESPONSABILIDAD: Recibe la contraseña ya validada y devuelve el hash bcrypt usando env.bcryptSaltRounds; no accede a usuarios ni persiste datos.
 * CONEXIONES: Importa: backend/src/config/env.ts Se utiliza desde: backend/src/repositories/admin.repository.ts, backend/src/repositories/clinic.repository.ts, backend/src/repositories/veterinarian.repository.ts, backend/src/services/admin-account.service.ts, backend/src/services/auth.service.ts, backend/src/services/bootstrap-super-admin.service.ts, backend/src/services/invitation.service.ts, backend/src/services/oauth.service.ts y 2 más
 * FUNCIONAMIENTO: Servicios de autenticación, invitación, bootstrap y cambio de cuenta → hashPassword → bcrypt y configuración env.
 * IMPORTANCIA: Centraliza el costo de hashing para que los flujos de alta y cambio usen el mismo criterio.
 */
/** Un único hashing para registro, bootstrap y establecimiento de contraseñas. */
import bcrypt from 'bcrypt';
import { env } from '../config/env';
/** Genera un hash bcrypt con el número de rondas establecido en la configuración validada del backend. */
export function hashPassword(password:string):Promise<string> {
  return bcrypt.hash(password,env.bcryptSaltRounds);
}
