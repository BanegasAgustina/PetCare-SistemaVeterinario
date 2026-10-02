/** Acceso parametrizado a usuarios; no recibe roles desde una solicitud pública. */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import type { AuthUser, RegisterInput, RoleCode, StoredUser } from '../types/auth';
import { AppError } from '../utils/app-error';
import { DatabaseError, runDatabaseOperation } from '../utils/database-error';
import { registerStage } from '../utils/register-diagnostics';

type UserRow = RowDataPacket & { id: string; first_name: string; last_name: string; email: string; phone: string | null; role: RoleCode; role_name: string; password_hash: string; is_active: number; email_verified_at: string | null; session_version: number };
const userColumns = 'u.id, u.first_name, u.last_name, u.email, u.phone, u.password_hash, u.is_active, u.email_verified_at, u.session_version, r.code AS role, r.name AS role_name';

function mapUser(row: UserRow): StoredUser {
  return { id: String(row.id), firstName: row.first_name, lastName: row.last_name, email: row.email, phone: row.phone, role: row.role, roleName: row.role_name, passwordHash: row.password_hash, isActive: row.is_active === 1, emailVerifiedAt: row.email_verified_at, sessionVersion: row.session_version };
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  return runDatabaseOperation(async () => {
    const [rows] = await databasePool.execute<UserRow[]>(`SELECT ${userColumns} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.email = ? LIMIT 1`, [email]);
    return rows[0] ? mapUser(rows[0]) : null;
  });
}

export async function findUserById(id: string): Promise<StoredUser | null> {
  return runDatabaseOperation(async () => {
    const [rows] = await databasePool.execute<UserRow[]>(`SELECT ${userColumns} FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id = ? LIMIT 1`, [id]);
    return rows[0] ? mapUser(rows[0]) : null;
  });
}

export function publicUser(user: StoredUser): AuthUser {
  // Selección explícita: evita filtrar hashes al agregar campos internos en el futuro.
  return { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone, role: user.role, roleName: user.roleName };
}

export async function createClientUser(input: RegisterInput, passwordHash: string, verificationTokenHash: string): Promise<AuthUser> {
  try {
    return await runDatabaseOperation(async () => {
      // LAST_INSERT_ID se consulta en la misma conexión para conservar IDs BIGINT como strings.
      registerStage('database_connection');
      const connection = await databasePool.getConnection();
      registerStage('database_connection_ok');
      try {
        await connection.beginTransaction();
        registerStage('client_role_resolution');
        const [roles] = await connection.execute<RowDataPacket[]>('SELECT id,name FROM roles WHERE code = ?', ['CLIENT']);
        if (!roles[0]) throw new AppError('AUTH_UNAVAILABLE', 503, 'El registro no está disponible. Intentá más tarde.');
        registerStage('client_role_resolved');
        registerStage('creating_user');
        await connection.execute('INSERT INTO users (role_id, email, password_hash, first_name, last_name, phone) VALUES (?, ?, ?, ?, ?, ?)', [roles[0].id, input.email, passwordHash, input.firstName, input.lastName, input.phone]);
        registerStage('user_created');
        const [identifiers] = await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');
        // La cuenta y su prueba restringida nacen juntas; cualquier fallo revierte ambas.
        registerStage('verification_proof');
        await connection.execute(`INSERT INTO email_verifications (user_id, token_hash, proof_expires_at, send_window_started_at, next_send_at, delivery)
          VALUES (?, ?, TIMESTAMPADD(HOUR, 24, UTC_TIMESTAMP(3)), UTC_TIMESTAMP(3), UTC_TIMESTAMP(3), 'failed')`, [identifiers[0].id, verificationTokenHash]);
        registerStage('verification_persisted');
        await connection.commit();
        registerStage('user_committed');
        return { id: identifiers[0].id as string, firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone, role: 'CLIENT', roleName: roles[0].name as string };
      } catch (error) { await connection.rollback(); throw error; }
      finally { connection.release(); }
    });
  } catch (error) {
    // La restricción UNIQUE también cubre dos registros concurrentes del mismo email.
    if (error instanceof DatabaseError && error.code === 'DB_CONFLICT') throw new AppError('EMAIL_ALREADY_EXISTS', 409, 'Ya existe una cuenta con ese email.');
    throw error;
  }
}
