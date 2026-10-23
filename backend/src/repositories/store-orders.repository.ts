import type { RowDataPacket } from 'mysql2/promise';
import type { AuthUser } from '../types/auth';
import * as clinic from './clinic.repository';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import { clientId } from '../validators/client.validator';
import * as v from '../validators/clinic.validator';
import * as storePayment from './store-payment.repository';
import { paymentProofUrl } from '../services/pet-photo.service';
import { createClientNotification } from './notification.repository';

const select = `o.id,o.order_type AS orderType,o.owner_id AS ownerId,CONCAT(u.first_name,' ',u.last_name) AS clientName,u.email AS clientEmail,u.phone AS clientPhone,
  o.store_order_status AS orderStatus,o.store_payment_status AS paymentStatus,o.payment_method AS paymentMethod,o.fulfillment_method AS fulfillmentMethod,
  o.delivery_status AS deliveryStatus,o.subtotal_cents AS subtotalCents,o.delivery_fee_cents AS deliveryFeeCents,o.total_cents AS totalCents,o.created_at AS createdAt,
  o.recipient_name AS recipientName,o.recipient_phone AS recipientPhone,o.delivery_street AS deliveryStreet,o.delivery_number AS deliveryNumber,o.delivery_unit AS deliveryUnit,
  o.delivery_city AS deliveryCity,o.delivery_province AS deliveryProvince,o.delivery_postal_code AS deliveryPostalCode,o.delivery_reference AS deliveryReference,o.payment_reference AS paymentReference,
  pi.buyer_name AS buyerName,pi.buyer_email AS buyerEmail,pi.transfer_reference AS transferReference,pi.expires_at AS paymentExpiresAt,pi.intent_status AS paymentIntentStatus,pi.proof_submitted_at AS proofSubmittedAt,(pi.proof_submitted_at>pi.expires_at) AS paymentProofLate,pi.review_status AS paymentReviewStatus,pi.review_reason AS paymentReviewReason,pi.verified_at AS paymentVerifiedAt,CONCAT(v.first_name,' ',v.last_name) AS verifiedBy`;
const operational = ['PLACED','CONFIRMED','PROCESSING','READY','IN_TRANSIT','DELIVERED','PICKED_UP','CANCELLED'];
const payment = ['PENDING','PAID','FAILED','REFUNDED'];

export async function list(actor: AuthUser, query: Record<string, unknown>) {
  clinic.permit(actor,'orders.view_all');
  const search = typeof query.search === 'string' ? query.search.trim() : '';
  if(search.length>120) v.invalid('El texto de búsqueda es demasiado largo.');
  const status = query.status === undefined || query.status === '' ? '' : String(query.status);
  if(status && !operational.includes(status)) v.invalid('El estado del pedido no es válido.');
  const method = query.fulfillmentMethod === undefined || query.fulfillmentMethod === '' ? '' : String(query.fulfillmentMethod);
  if(method && !['PICKUP','DELIVERY'].includes(method)) v.invalid('El método de entrega no es válido.');
  const paymentStatus = query.paymentStatus === undefined || query.paymentStatus === '' ? '' : String(query.paymentStatus);
  if(paymentStatus && !payment.includes(paymentStatus)) v.invalid('El estado del pago no es válido.');
  const from = typeof query.from === 'string' && query.from ? query.from : '';
  const to = typeof query.to === 'string' && query.to ? query.to : '';
  for(const date of [from,to]) if(date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) v.invalid('La fecha no es válida.');
  const where = ['o.is_store_order=1']; const params: (string|number)[]=[];
  if(search){where.push("(CAST(o.id AS CHAR)=? OR CONCAT(u.first_name,' ',u.last_name) LIKE ? OR u.email LIKE ?)");params.push(search,`%${search}%`,`%${search}%`);}
  if(status){where.push('o.store_order_status=?');params.push(status);}
  if(method){where.push('o.fulfillment_method=?');params.push(method);}
  if(paymentStatus){where.push('o.store_payment_status=?');params.push(paymentStatus);}
  if(from){where.push('o.created_at>=?');params.push(`${from} 00:00:00`);}
  if(to){where.push('o.created_at<DATE_ADD(?, INTERVAL 1 DAY)');params.push(to);}
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${select} FROM client_orders o JOIN users u ON u.id=o.owner_id LEFT JOIN client_store_payment_intents pi ON pi.id=(SELECT MAX(pi2.id) FROM client_store_payment_intents pi2 WHERE pi2.order_id=o.id) LEFT JOIN users v ON v.id=pi.verified_by WHERE ${where.join(' AND ')} ORDER BY o.created_at DESC,o.id DESC LIMIT 100`,params);
  return rows.map(mapOrder);
}

export async function detail(actor: AuthUser, id: string) {
  clinic.permit(actor,'orders.view_all');
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${select} FROM client_orders o JOIN users u ON u.id=o.owner_id LEFT JOIN client_store_payment_intents pi ON pi.id=(SELECT MAX(pi2.id) FROM client_store_payment_intents pi2 WHERE pi2.order_id=o.id) LEFT JOIN users v ON v.id=pi.verified_by WHERE o.id=? AND o.is_store_order=1`,[id]);
  if(!rows[0]) throw new AppError('NOT_FOUND',404,'Pedido de tienda no encontrado.');
  const [items]=await databasePool.execute<RowDataPacket[]>(`SELECT product_id AS productId,product_name AS name,quantity,price_cents AS priceCents,quantity*price_cents AS subtotalCents FROM client_order_items WHERE order_id=? ORDER BY product_id`,[id]);
  const [history]=await databasePool.execute<RowDataPacket[]>(`SELECT h.state_type AS stateType,h.previous_status AS previousStatus,h.new_status AS newStatus,h.occurred_at AS occurredAt,h.reason,CONCAT(u.first_name,' ',u.last_name) AS actorName FROM client_order_status_history h LEFT JOIN users u ON u.id=h.actor_user_id WHERE h.order_id=? ORDER BY h.occurred_at,h.id`,[id]);
  return {...mapOrder(rows[0]),items:items.map(item=>({...item,productId:String(item.productId),quantity:Number(item.quantity),priceCents:Number(item.priceCents),subtotalCents:Number(item.subtotalCents)})),history};
}

export async function update(actor: AuthUser, rawId: unknown, value: unknown) {
  const id=clientId(rawId);const body=v.body(value,['orderStatus','paymentStatus']);
  if((body.orderStatus===undefined)===(body.paymentStatus===undefined)) v.invalid('Indicá un único estado para actualizar.');
  return clinic.transaction(actor,async(c,fresh)=>{
    const manageOrder=body.orderStatus!==undefined;clinic.permit(fresh,manageOrder?'orders.manage':'orders.payment.manage');
    const [rows]=await c.execute<RowDataPacket[]>(`SELECT owner_id AS ownerId,store_order_status AS orderStatus,store_payment_status AS paymentStatus,payment_method AS paymentMethod,fulfillment_method AS fulfillmentMethod,delivery_status AS deliveryStatus,order_type AS orderType FROM client_orders WHERE id=? AND is_store_order=1 FOR UPDATE`,[id]);
    if(!rows[0]) throw new AppError('NOT_FOUND',404,'Pedido de tienda no encontrado.');
    const old=String(manageOrder?rows[0].orderStatus:rows[0].paymentStatus);
    const next=String(manageOrder?body.orderStatus:body.paymentStatus);
    if(!(manageOrder?operational:payment).includes(next)) v.invalid('El estado indicado no es válido.');
    if(old===next)return {saved:true};
    if(!manageOrder&&String(rows[0].orderType)==='STORE_PURCHASE') throw new AppError('PAYMENT_REVIEW_REQUIRED',409,'Las transferencias reales requieren comprobante, motivo y revisión del administrador principal.');
    if(!manageOrder&&String(rows[0].paymentMethod)!=='BANK_TRANSFER') throw new AppError('PAYMENT_NOT_VERIFIABLE',409,'Este pedido no tiene un pago real que se pueda verificar.');
    if(manageOrder&&next!=='CANCELLED'&&String(rows[0].paymentStatus)!=='PAID') throw new AppError('PAYMENT_NOT_CONFIRMED',409,'Confirmá el pago antes de avanzar con la preparación o entrega.');
    if(manageOrder&&!validTransition(old,next,String(rows[0].fulfillmentMethod))) throw new AppError('INVALID_ORDER_TRANSITION',409,'Ese cambio no está permitido desde el estado actual.');
    if(!manageOrder&&!(old==='PENDING'&&next==='PAID'||old==='PENDING'&&next==='FAILED'||old==='PAID'&&next==='REFUNDED')) throw new AppError('INVALID_PAYMENT_TRANSITION',409,'Ese cambio de pago no está permitido.');
    if(manageOrder){
      const deliveryStatus=String(rows[0].fulfillmentMethod)==='DELIVERY'?(next==='IN_TRANSIT'?'IN_TRANSIT':next==='DELIVERED'?'DELIVERED':next==='CANCELLED'?'CANCELLED':'PENDING'):(next==='PICKED_UP'?'PICKED_UP':next==='CANCELLED'?'CANCELLED':'PENDING');
      await c.execute('UPDATE client_orders SET store_order_status=?,delivery_status=? WHERE id=?',[next,deliveryStatus,id]);
      await c.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,state_type) VALUES (?,?,?,?,?)',[id,old,next,fresh.id,'ORDER']);
      const previousDelivery=String(rows[0].deliveryStatus);
      if(previousDelivery!==deliveryStatus) await c.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,state_type) VALUES (?,?,?,?,?)',[id,previousDelivery,deliveryStatus,fresh.id,'DELIVERY']);
    } else await c.execute('UPDATE client_orders SET store_payment_status=? WHERE id=?',[next,id]);
    if(!manageOrder) await c.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,state_type) VALUES (?,?,?,?,?)',[id,old,next,fresh.id,'PAYMENT']);
    const eventType=manageOrder?`ORDER_${next}`:`ORDER_PAYMENT_${next}`;
    const titles:Record<string,string>={PLACED:'Pedido registrado',CONFIRMED:'Pedido confirmado',PROCESSING:'Pedido en preparación',READY:'Pedido listo para retirar',IN_TRANSIT:'Pedido en camino',DELIVERED:'Pedido entregado',PICKED_UP:'Pedido retirado',CANCELLED:'Pedido cancelado',PAID:'Pago confirmado',FAILED:'Pago rechazado',REFUNDED:'Pago reembolsado'};
    const descriptions:Record<string,string>={PLACED:'Registramos tu pedido.',CONFIRMED:'La clínica confirmó tu pedido.',PROCESSING:'Tu pedido está en preparación.',READY:'Tu pedido está listo para retirar.',IN_TRANSIT:'Tu pedido salió a reparto.',DELIVERED:'Tu pedido fue entregado.',PICKED_UP:'Tu pedido fue retirado.',CANCELLED:'La clínica canceló tu pedido.',PAID:'La clínica confirmó el pago de tu pedido.',FAILED:'El pago de tu pedido fue rechazado.',REFUNDED:'El pago de tu pedido fue reembolsado.'};
    await createClientNotification(c,{ownerId:String(rows[0].ownerId),title:titles[next]??'Actualización de pedido',body:`${descriptions[next]??'El pedido cambió de estado.'} Pedido #${id}.`,eventType,eventKey:`store-order:${id}:${manageOrder?'status':'payment'}:${old}:${next}`,referenceType:'order',referenceId:id});
    return {saved:true};
  });
}
export async function proof(actor:AuthUser,id:string){const result=await storePayment.proofForAdmin(actor,id);if(!result.objectKey)throw new AppError('PAYMENT_PROOF_REQUIRED',404,'El cliente todavía no envió un comprobante.');return {...result,url:await paymentProofUrl(result.objectKey)};}
export async function reviewPayment(actor:AuthUser,id:string,value:unknown){return storePayment.review(actor,id,value);}

function validTransition(old:string,next:string,method:string){
  if(next==='CANCELLED') return ['PLACED','CONFIRMED','PROCESSING'].includes(old);
  const pickup:Record<string,string[]>={PLACED:['CONFIRMED'],CONFIRMED:['PROCESSING'],PROCESSING:['READY'],READY:['PICKED_UP']};
  const delivery:Record<string,string[]>={PLACED:['CONFIRMED'],CONFIRMED:['PROCESSING'],PROCESSING:['IN_TRANSIT'],IN_TRANSIT:['DELIVERED']};
  return (method==='PICKUP'?pickup:delivery)[old]?.includes(next)??false;
}
function mapOrder(row:RowDataPacket){return {...row,id:String(row.id),ownerId:String(row.ownerId),paymentProofLate:Boolean(row.paymentProofLate),subtotalCents:Number(row.subtotalCents??0),deliveryFeeCents:Number(row.deliveryFeeCents??0),totalCents:Number(row.totalCents),createdAt:row.createdAt};}
