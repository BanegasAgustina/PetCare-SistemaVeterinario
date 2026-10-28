// Este archivo se encarga de lo siguiente: Servicio móvil que agrupa comunicación con la API o manejo de sesión y eventos.

/** Un único hashing para registro, bootstrap y establecimiento de contraseñas. */
import bcrypt from 'bcrypt';
import { env } from '../config/env';
// Función hashPassword: comprueba una regla o condición dentro de este módulo.
export function hashPassword(password:string):Promise<string> {
  return bcrypt.hash(password,env.bcryptSaltRounds);
}
