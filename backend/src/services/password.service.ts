/** Un único hashing para registro, bootstrap y establecimiento de contraseñas. */
import bcrypt from 'bcrypt';
import { env } from '../config/env';
export function hashPassword(password:string):Promise<string> {
  return bcrypt.hash(password,env.bcryptSaltRounds);
}
