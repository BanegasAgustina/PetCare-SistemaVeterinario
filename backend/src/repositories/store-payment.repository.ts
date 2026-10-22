import type { RowDataPacket } from 'mysql2/promise';
import type { AuthUser } from '../types/auth';
import { databasePool } from '../config/database';
import * as clinic from './clinic.repository';
import { AppError } from '../utils/app-error';
import { clientId, text } from '../validators/client.validator';

export async function submitProof(owner:string,rawId:unknown,key:string,contentType:string,size:number,reference?:string){
  const id=clientId(rawId),connection=await databasePool.getConnection();
  try{await connection.beginTransaction();
    const [rows]=await connection.execute<RowDataPacket[]>(`SELECT pi.id,pi.proof_object_key AS oldKey,pi.review_status AS reviewStatus,o.store_payment_status AS paymentStatus
      FROM client_store_payment_intents pi JOIN client_orders o ON o.id=pi.order_id WHERE pi.id=? AND pi.owner_id=? AND pi.id=(SELECT MAX(pi2.id) FROM client_store_payment_intents pi2 WHERE pi2.order_id=pi.order_id) FOR UPDATE`,[id,owner]);
    if(!rows[0])throw new AppError('NOT_FOUND',404,'No encontramos la intención de pago.');
    if(rows[0].reviewStatus==='APPROVED'||rows[0].paymentStatus==='PAID')throw new AppError('PAYMENT_ALREADY_CONFIRMED',409,'Este pago ya fue confirmado.');
    await connection.execute(`UPDATE client_store_payment_intents SET proof_object_key=?,proof_content_type=?,proof_size_bytes=?,proof_submitted_at=UTC_TIMESTAMP(3),transfer_reference=?,review_status='SUBMITTED',review_reason=NULL,verified_by=NULL,verified_at=NULL WHERE id=?`,[key,contentType,size,reference??null,id]);
    await connection.commit();return {submitted:true,previousKey:rows[0].oldKey as string|null};
  }catch(e){await connection.rollback();throw e;}finally{connection.release();}
}
export async function assertOwnedIntent(owner:string,rawId:unknown){
  const id=clientId(rawId),[rows]=await databasePool.execute<RowDataPacket[]>(`SELECT pi.id FROM client_store_payment_intents pi JOIN client_orders o ON o.id=pi.order_id WHERE pi.id=? AND pi.owner_id=? AND o.store_payment_status='PENDING' AND pi.id=(SELECT MAX(pi2.id) FROM client_store_payment_intents pi2 WHERE pi2.order_id=pi.order_id)`,[id,owner]);
  if(!rows[0])throw new AppError('NOT_FOUND',404,'No encontramos la intención de pago.');
}

export async function proofForAdmin(actor:AuthUser,rawOrderId:unknown){
  clinic.permit(actor,'orders.payment.manage');const id=clientId(rawOrderId);
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT pi.id,pi.proof_object_key AS objectKey,pi.proof_content_type AS contentType,pi.proof_size_bytes AS sizeBytes,pi.proof_submitted_at AS submittedAt,pi.expires_at AS expiresAt,pi.transfer_reference AS transferReference,pi.buyer_name AS buyerName,pi.buyer_email AS buyerEmail,pi.review_status AS reviewStatus,pi.review_reason AS reviewReason,pi.verified_at AS verifiedAt,CONCAT(v.first_name,' ',v.last_name) AS verifiedBy
    FROM client_store_payment_intents pi JOIN client_orders o ON o.id=pi.order_id LEFT JOIN users v ON v.id=pi.verified_by WHERE o.id=? AND o.is_store_order=1 AND pi.id=(SELECT MAX(pi2.id) FROM client_store_payment_intents pi2 WHERE pi2.order_id=o.id)`,[id]);
  if(!rows[0])throw new AppError('NOT_FOUND',404,'No encontramos el comprobante.');
  const {objectKey,...data}=rows[0];return {...data,submittedAt:data.submittedAt?String(data.submittedAt).replace(' ','T')+'Z':null,expiresAt:data.expiresAt?String(data.expiresAt).replace(' ','T')+'Z':null,verifiedAt:data.verifiedAt?String(data.verifiedAt).replace(' ','T')+'Z':null,hasProof:Boolean(objectKey),objectKey:objectKey as string|null};
}

export async function review(actor:AuthUser,rawOrderId:unknown,value:unknown){
  const id=clientId(rawOrderId),body=value&&typeof value==='object'?value as Record<string,unknown>:{},status=body.paymentStatus as 'PAID'|'FAILED';
  if(Object.keys(body).some(k=>!['paymentStatus','reason'].includes(k))||!['PAID','FAILED'].includes(status as string))throw new AppError('VALIDATION_ERROR',400,'La revisión de pago no es válida.');
  const reason=text(body.reason,500)!;if(reason.trim().length<3)throw new AppError('VALIDATION_ERROR',400,'Registrá un motivo para aprobar o rechazar la verificación.');
  return clinic.transaction(actor,async(c,fresh)=>{
    if(fresh.role!=='SUPER_ADMIN')throw new AppError('FORBIDDEN',403,'Solo el administrador principal puede verificar transferencias.');
    clinic.permit(fresh,'orders.payment.manage');
    const [rows]=await c.execute<RowDataPacket[]>(`SELECT o.owner_id AS ownerId,o.store_payment_status AS paymentStatus,o.payment_method AS paymentMethod,pi.id AS intentId,pi.proof_object_key AS proofKey,pi.review_status AS reviewStatus
      FROM client_orders o JOIN client_store_payment_intents pi ON pi.id=(SELECT MAX(pi2.id) FROM client_store_payment_intents pi2 WHERE pi2.order_id=o.id) WHERE o.id=? AND o.is_store_order=1 FOR UPDATE`,[id]);
    const order=rows[0];if(!order)throw new AppError('NOT_FOUND',404,'Pedido de tienda sin intención de transferencia.');
    if(order.paymentMethod!=='BANK_TRANSFER'||order.paymentStatus!=='PENDING')throw new AppError('INVALID_PAYMENT_TRANSITION',409,'El pago ya cambió de estado. Actualizá el pedido.');
    if(!order.proofKey||order.reviewStatus!=='SUBMITTED')throw new AppError('PAYMENT_PROOF_REQUIRED',409,'Revisá un comprobante antes de verificar la transferencia.');
    if(status==='PAID'){
      const [items]=await c.execute<RowDataPacket[]>(`SELECT i.product_id AS productId,i.quantity,p.stock,p.reserved_stock AS reservedStock FROM client_order_items i JOIN client_products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY p.id FOR UPDATE`,[id]);
      if(items.some(i=>Number(i.stock)-Number(i.reservedStock)<Number(i.quantity)))throw new AppError('STOCK_UNAVAILABLE',409,'El pago se recibió, pero el stock cambió. Resolvé la disponibilidad antes de aprobar el pedido.');
      for(const item of items){const before=Number(item.stock),after=before-Number(item.quantity);await c.execute('UPDATE client_products SET stock=?,updated_by=? WHERE id=?',[after,fresh.id,item.productId]);await c.execute('INSERT INTO client_product_stock_movements(product_id,actor_user_id,quantity_before,quantity_after,quantity_delta,reason) VALUES (?,?,?,?,?,?)',[item.productId,fresh.id,before,after,-Number(item.quantity),`Venta confirmada · pedido #${id}`]);}
    }
    await c.execute('UPDATE client_store_payment_intents SET review_status=?,review_reason=?,verified_by=?,verified_at=UTC_TIMESTAMP(3) WHERE id=?',[status==='PAID'?'APPROVED':'REJECTED',reason,fresh.id,order.intentId]);
    await c.execute('UPDATE client_orders SET store_payment_status=?,payment_status=? WHERE id=?',[status,status==='PAID'?'PAID':'PAYMENT_FAILED',id]);
    await c.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,reason,state_type) VALUES (?,\'PENDING\',?,?,?,\'PAYMENT\')',[id,status,fresh.id,reason]);
    await clinic.notify(c,order.ownerId,status==='PAID'?'Transferencia confirmada':'Comprobante rechazado',status==='PAID'?`La transferencia del pedido #${id} fue confirmada.`:`No pudimos validar el pago del pedido #${id}. Motivo: ${reason}`,'ORDER_PAYMENT','order',id,`store-payment:${id}:${status}`);
    return {saved:true,paymentStatus:status};
  });
}

export async function createNewIntent(owner:string,rawOrderId:unknown){
  const orderId=clientId(rawOrderId),c=await databasePool.getConnection();
  try{await c.beginTransaction();await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[owner]);
    const [orders]=await c.execute<RowDataPacket[]>(`SELECT id,store_payment_status AS paymentStatus FROM client_orders WHERE id=? AND owner_id=? AND order_type='STORE_PURCHASE' AND is_store_order=1 FOR UPDATE`,[orderId,owner]);
    if(!orders[0]||!['PENDING','FAILED'].includes(String(orders[0].paymentStatus)))throw new AppError('PAYMENT_INTENT_UNAVAILABLE',409,'Este pedido no puede iniciar una nueva transferencia.');
    const [intents]=await c.execute<RowDataPacket[]>(`SELECT id,buyer_name AS buyerName,buyer_email AS buyerEmail,expires_at<=UTC_TIMESTAMP(3) AS expired,review_status AS reviewStatus FROM client_store_payment_intents WHERE order_id=? ORDER BY id DESC LIMIT 1 FOR UPDATE`,[orderId]);
    if(!intents[0]||(!Boolean(intents[0].expired)&&orders[0].paymentStatus==='PENDING')||intents[0].reviewStatus==='SUBMITTED')throw new AppError('PAYMENT_INTENT_UNAVAILABLE',409,'El plazo actual sigue activo o el comprobante ya está en revisión.');
    await c.execute("UPDATE client_store_payment_intents SET intent_status='EXPIRED' WHERE order_id=? AND intent_status='ACTIVE' AND expires_at<=UTC_TIMESTAMP(3)",[orderId]);
    await c.execute(`INSERT INTO client_store_payment_intents(order_id,owner_id,buyer_name,buyer_email,expires_at) VALUES (?,?,?,?,TIMESTAMPADD(MINUTE,5,UTC_TIMESTAMP(3)))`,[orderId,owner,intents[0].buyerName,intents[0].buyerEmail]);
    const [created]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id',[]),newId=String(created[0].id);
    if(orders[0].paymentStatus==='FAILED'){
      await c.execute("UPDATE client_orders SET store_payment_status='PENDING',payment_status='PENDING_VERIFICATION' WHERE id=?",[orderId]);
      await c.execute("INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,reason,state_type) VALUES (?,\'FAILED\',\'PENDING\',?,'Nueva intención de transferencia','PAYMENT')",[orderId,owner]);
    }
    await c.commit();return {id:newId};
  }catch(error){await c.rollback();throw error;}finally{c.release();}
}
