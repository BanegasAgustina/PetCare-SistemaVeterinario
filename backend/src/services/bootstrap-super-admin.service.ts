/** Bootstrap local de una cuenta real: no existe endpoint público para esta operación. */
import type { Pool,RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { withDatabaseLock } from '../database/lock';
import { validateRegister } from '../validators/auth.validator';
import { hashPassword } from './password.service';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
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
