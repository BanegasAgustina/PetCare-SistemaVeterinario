// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/**
 * Limpieza transitoria de reservas comerciales históricas.
 * No permite crear, consultar ni cambiar reservas; solo libera stock vencido existente.
 * Retirar este worker cuando el preflight de legado confirme cero operaciones abiertas.
 */
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import * as db from './clinic.repository';
import { AppError } from '../utils/app-error';

/** Mantiene consistente reserved_stock mientras se auditan las operaciones heredadas. */
// Función expireDueReservations: concentra la lógica dentro de este módulo.
export async function expireDueReservations(batchSize=100):Promise<number> {
 const connection=await databasePool.getConnection();let count=0;
 try {await connection.beginTransaction();
  const [orders]=await connection.execute<(RowDataPacket & {id:string;ownerId:string;status:string})[]>(`SELECT CAST(id AS CHAR) AS id,CAST(owner_id AS CHAR) AS ownerId,status FROM client_orders WHERE order_type='RESERVATION' AND status IN ('PLACED','CONFIRMED','PROCESSING','READY') AND expires_at<=UTC_TIMESTAMP(3) ORDER BY expires_at,id LIMIT ? FOR UPDATE SKIP LOCKED`,[Math.max(1,Math.min(500,batchSize))]);
  for(const order of orders){const [updated]=await connection.execute("UPDATE client_orders SET status='EXPIRED' WHERE id=? AND status=? AND expires_at<=UTC_TIMESTAMP(3)",[order.id,order.status]);if((updated as {affectedRows?:number}).affectedRows!==1)continue;
   const [items]=await connection.execute<(RowDataPacket & {productId:string;quantity:number;reservedStock:number})[]>('SELECT i.product_id AS productId,i.quantity,p.reserved_stock AS reservedStock FROM client_order_items i JOIN client_products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY p.id FOR UPDATE',[order.id]);
   for(const item of items){if(Number(item.reservedStock)<Number(item.quantity))throw new AppError('STOCK_CONFLICT',409,'El stock reservado requiere revisión administrativa.');const [stockUpdate]=await connection.execute('UPDATE client_products SET reserved_stock=reserved_stock-? WHERE id=? AND reserved_stock>=?',[item.quantity,item.productId,item.quantity]);if((stockUpdate as {affectedRows?:number}).affectedRows!==1)throw new AppError('STOCK_CONFLICT',409,'No se pudo liberar el stock vencido.');}
   await connection.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id) VALUES (?,?,?,NULL)',[order.id,order.status,'EXPIRED']);await db.notify(connection,order.ownerId,'La reserva venció','El plazo de retiro terminó y las unidades volvieron al stock.','RESERVATION_EXPIRED','reservation',order.id,`reservation:${order.id}:EXPIRED`);count+=1;
  }
  await connection.commit();return count;
 }catch(error){await connection.rollback();throw error;}finally{connection.release();}
}