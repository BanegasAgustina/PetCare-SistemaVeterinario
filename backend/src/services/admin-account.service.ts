/**
 * ARCHIVO: admin-account.service.ts
 * UBICACIÓN: backend/src/services/admin-account.service.ts
 * FUNCIÓN: Edición del perfil propio y cambio de contraseña para cuentas ADMIN y SUPER_ADMIN.
 * RESPONSABILIDAD: Valida únicamente campos admitidos, toma el usuario autenticado como identidad, consulta/actualiza MySQL y exige contraseña actual al cambiarla.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/utils/app-error.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts Se utiliza desde: backend/src/routes/admin.routes.ts
 * FUNCIONAMIENTO: Rutas administrativas → controladores/rutas de cuenta → este servicio → validadores, bcrypt/password.service y users en MySQL. El cambio incrementa session_version para revocar sesiones anteriores.
 * IMPORTANCIA: Mantiene el autoservicio administrativo sin permitir que el cliente elija otro usuario ni omita la comprobación de credenciales.
 */
/** Edición de la cuenta propia de un administrador, derivada siempre del JWT. */
import bcrypt from 'bcrypt';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import { readName, readPassword, readPhone } from '../validators/auth.validator';
import { hashPassword } from './password.service';

/** Rechaza cuerpos que no sean objetos o incluyan claves fuera de la lista permitida. */
function bodyObject(value: unknown, allowed: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(key => !allowed.includes(key))) {
    throw new AppError('VALIDATION_ERROR', 400, 'Revisá los datos enviados.');
  }
  return value as Record<string, unknown>;
}

/** Valida nombre, apellido y teléfono; confirma que la cuenta activa exista y actualiza sus datos propios. */
export async function updateOwnProfile(userId: string, value: unknown) {
  const body = bodyObject(value, ['firstName', 'lastName', 'phone']);
  const firstName = readName(body.firstName, 'El nombre');
  const lastName = readName(body.lastName, 'El apellido');
  const phone = readPhone(body.phone);
  const [existing] = await databasePool.execute<RowDataPacket[]>('SELECT id FROM users WHERE id=? AND is_active=1', [userId]);
  if (!existing.length) throw new AppError('NOT_FOUND', 404, 'No encontramos una cuenta activa para actualizar.');
  await databasePool.execute('UPDATE users SET first_name=?,last_name=?,phone=? WHERE id=? AND is_active=1', [firstName, lastName, phone, userId]);
  return { updated: true };
}

/** Bloquea la fila del administrador, compara la contraseña actual y actualiza el hash; incrementa session_version y requiere iniciar sesión otra vez. */
export async function changeOwnPassword(userId: string, value: unknown) {
  const body = bodyObject(value, ['currentPassword', 'newPassword']);
  const current = readPassword(body.currentPassword, false);
  const next = readPassword(body.newPassword, true);
  const connection = await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>("SELECT u.password_hash AS passwordHash,r.code FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? AND u.is_active=1 FOR UPDATE", [userId]);
    if (!['ADMIN', 'SUPER_ADMIN'].includes(String(rows[0]?.code))) throw new AppError('FORBIDDEN', 403, 'Solo un administrador puede cambiar esta contraseña.');
    if (!await bcrypt.compare(current, String(rows[0].passwordHash))) throw new AppError('CURRENT_PASSWORD_INVALID', 401, 'La contraseña actual no es correcta.');
    if (current === next) throw new AppError('VALIDATION_ERROR', 400, 'Elegí una contraseña distinta a la actual.');
    await connection.execute('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?', [await hashPassword(next), userId]);
    await connection.commit();
    return { updated: true, requiresLogin: true };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}
