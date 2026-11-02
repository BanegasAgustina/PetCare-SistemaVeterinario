/**
 * ARCHIVO: bootstrap-super-admin.service.ts
 * UBICACIÓN: backend/src/services/bootstrap-super-admin.service.ts
 * FUNCIÓN: Creación inicial del primer SUPER_ADMIN desde una operación local controlada.
 * RESPONSABILIDAD: Valida y hashea los datos; serializa el bootstrap, comprueba que el rol exista y que no haya ya un SUPER_ADMIN o correo duplicado; inserta dentro de transacción.
 * CONEXIONES: Importa: backend/src/config/database.ts, backend/src/database/lock.ts, backend/src/validators/auth.validator.ts, backend/src/services/password.service.ts, backend/src/utils/database-error.ts, backend/src/utils/app-error.ts Se utiliza desde: backend/src/database/create-super-admin.ts
 * FUNCIONAMIENTO: database/create-super-admin.ts → este servicio → lock, auth.validator, password.service y MySQL. No expone una ruta pública.
 * IMPORTANCIA: Permite establecer la primera cuenta privilegiada sin convertir el registro público en un mecanismo de elevación de privilegios.
 */
/** Bootstrap local de una cuenta real: no existe endpoint público para esta operación. */
import type { Pool,RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from '../database/lock';
import { validateRegister } from '../validators/auth.validator';
import { hashPassword } from './password.service';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
/** Crea de forma transaccional el primer SUPER_ADMIN tras validar entrada, bloquear el bootstrap y comprobar rol, cuenta previa y email duplicado. */
export async function createFirstSuperAdmin(body:unknown,pool:Pick<Pool,'getConnection'>=databasePool) {
  const input=validateRegister(body);const hash=await hashPassword(input.password);
  return runDatabaseOperation(async()=>{
    const c=await pool.getConnection();
    try {return await withDatabaseLock(c,async()=>{
      await c.beginTransaction();
      try {
        const [roles]=await c.execute<RowDataPacket[]>("SELECT id FROM roles WHERE code=? FOR UPDATE",['SUPER_ADMIN']);
        if(!roles[0])throw new AppError('ROLE_NOT_CONFIGURED',503,'El rol SUPER_ADMIN no existe en MySQL.');
        const [existing]=await c.execute<RowDataPacket[]>('SELECT id FROM users WHERE role_id=? LIMIT 1',[roles[0].id]);
        if(existing.length)throw new AppError('BOOTSTRAP_ALREADY_COMPLETED',409,'Ya existe un SUPER_ADMIN. Usá la gestión administrativa para crear otras cuentas.');
        const [duplicates]=await c.execute<RowDataPacket[]>('SELECT id FROM users WHERE email=? LIMIT 1',[input.email]);
        if(duplicates.length)throw new AppError('EMAIL_ALREADY_EXISTS',409,'Ese email ya está registrado. El bootstrap no promueve cuentas existentes.');
        // El operador local con acceso a MySQL establece identidad y contraseña fuera del registro público.
        await c.execute('INSERT INTO users (role_id,email,password_hash,first_name,last_name,phone,is_active,email_verified_at) VALUES (?,?,?,?,?,?,1,UTC_TIMESTAMP(3))',
          [roles[0].id,input.email,hash,input.firstName,input.lastName,input.phone]);
        await c.commit();return {created:true};
      }catch(error){await c.rollback();throw error;}
    });}finally{c.release();}
  });
}
