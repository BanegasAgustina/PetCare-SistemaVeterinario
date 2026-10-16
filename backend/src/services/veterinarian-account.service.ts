/** Actualizaciones propias del profesional; su identidad nunca proviene del cuerpo HTTP. */
import bcrypt from 'bcrypt';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import { readName, readPassword, readPhone } from '../validators/auth.validator';
import { hashPassword } from './password.service';

export async function updateOwnProfile(userId:string,value:unknown) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new AppError('VALIDATION_ERROR',400,'Revisá los datos del perfil.');
  const body=value as Record<string,unknown>;
  if(Object.keys(body).some(key=>!['firstName','lastName','phone','professionalDescription'].includes(key)))throw new AppError('VALIDATION_ERROR',400,'La solicitud contiene campos no permitidos.');
  const firstName=readName(body.firstName,'El nombre'),lastName=readName(body.lastName,'El apellido'),phone=readPhone(body.phone);
  if(typeof body.professionalDescription!=='string'||body.professionalDescription.trim().length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(body.professionalDescription))throw new AppError('VALIDATION_ERROR',400,'La descripción profesional admite hasta 2.000 caracteres.');
  const description=body.professionalDescription.trim().normalize('NFC')||null;
  const connection=await databasePool.getConnection();
  try {await connection.beginTransaction();const [rows]=await connection.execute<RowDataPacket[]>("SELECT r.code,v.id AS veterinarianId FROM users u JOIN roles r ON r.id=u.role_id LEFT JOIN veterinarians v ON v.user_id=u.id WHERE u.id=? FOR UPDATE",[userId]);if(rows[0]?.code!=='VETERINARIAN'||!rows[0].veterinarianId)throw new AppError('FORBIDDEN',403,'Solo el veterinario puede editar su perfil.');await connection.execute('UPDATE users SET first_name=?,last_name=?,phone=? WHERE id=?',[firstName,lastName,phone,userId]);await connection.execute('UPDATE veterinarians SET professional_description=? WHERE user_id=?',[description,userId]);await connection.commit();return {updated:true};}
  catch(error){await connection.rollback();throw error;}finally{connection.release();}
}

export async function changeOwnPassword(userId:string,value:unknown) {
  if(!value||typeof value!=='object'||Array.isArray(value))throw new AppError('VALIDATION_ERROR',400,'Revisá las contraseñas ingresadas.');
  const body=value as Record<string,unknown>;
  if(Object.keys(body).some(key=>!['currentPassword','newPassword'].includes(key)))throw new AppError('VALIDATION_ERROR',400,'La solicitud contiene campos no permitidos.');
  const current=readPassword(body.currentPassword,false),next=readPassword(body.newPassword,true);
  const connection=await databasePool.getConnection();
  try {
    await connection.beginTransaction();
    const [rows]=await connection.execute<RowDataPacket[]>("SELECT u.password_hash AS passwordHash,r.code FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=? FOR UPDATE",[userId]);
    if(rows[0]?.code!=='VETERINARIAN')throw new AppError('FORBIDDEN',403,'Solo el veterinario puede cambiar su contraseña.');
    if(!await bcrypt.compare(current,String(rows[0].passwordHash)))throw new AppError('CURRENT_PASSWORD_INVALID',401,'La contraseña actual no es correcta.');
    if(current===next)throw new AppError('VALIDATION_ERROR',400,'Elegí una contraseña distinta a la actual.');
    await connection.execute('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?',[await hashPassword(next),userId]);
    await connection.commit();return {updated:true};
  } catch(error){await connection.rollback();throw error;}finally{connection.release();}
}
