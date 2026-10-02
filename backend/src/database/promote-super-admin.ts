/** Operación de bootstrap exclusivamente por consola de un operador con acceso DB.
 * Nunca se expone por HTTP ni promueve usuarios automáticamente. Requiere ID explícito.
 */
import {databasePool} from '../config/database';
import {identifier} from '../validators/veterinarian.validator';
import {runDatabaseOperation} from '../utils/database-error';
import {AppError} from '../utils/app-error';
import type {RowDataPacket} from 'mysql2/promise';
async function promote() {
  const userId=identifier(process.argv[2]);
  await runDatabaseOperation(async()=>{
    const connection=await databasePool.getConnection();
    try {
      await connection.beginTransaction();
      const [users]=await connection.execute<RowDataPacket[]>('SELECT id,is_active,email_verified_at FROM users WHERE id=? FOR UPDATE',[userId]);
      if (!users[0]?.is_active||!users[0].email_verified_at)throw new AppError('INVALID_ACCOUNT',400,'La cuenta debe existir, estar activa y tener correo verificado.');
      const [profiles]=await connection.execute<RowDataPacket[]>('SELECT id FROM veterinarians WHERE user_id=?',[userId]);
      if(profiles.length)throw new AppError('INVALID_ACCOUNT',400,'No se cambia el rol de un profesional con perfil veterinario.');
      const [roles]=await connection.execute<RowDataPacket[]>("SELECT id FROM roles WHERE code='SUPER_ADMIN'");
      if(!roles[0])throw new AppError('MIGRATIONS_PENDING',503,'Aplicá las migraciones antes de preparar Super Admin.');
      await connection.execute('DELETE FROM user_permissions WHERE user_id=?',[userId]);
      await connection.execute('UPDATE users SET role_id=?,session_version=session_version+1 WHERE id=?',[roles[0].id,userId]);
      await connection.commit();
    } catch(error){await connection.rollback();throw error;} finally {connection.release();}
  });
  console.log('Cuenta existente promovida a SUPER_ADMIN. Iniciá una nueva sesión.');
}
void promote().catch(error=>{console.error(error instanceof AppError?error.message:'No se pudo preparar Super Admin. Revisá MySQL y las migraciones.');process.exitCode=1;}).finally(()=>databasePool.end());
