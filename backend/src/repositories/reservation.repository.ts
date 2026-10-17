/** Reservas para retiro: no procesa pagos ni crea pedidos paralelos. */
import type { AuthUser } from '../types/auth';
import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import * as db from './clinic.repository';
import * as v from '../validators/clinic.validator';
import { AppError } from '../utils/app-error';
import { productPhotoUrl } from '../services/pet-photo.service';
// Se valida tanto la transición de estado como el tipo de producto reservado.
import { activeReservationStatuses,assertReservableProduct,assertReservationTransition } from '../utils/clinic-rules';
import { forbidden } from '../utils/admin-authorization';
import { formatNotificationDateTime } from '../utils/notification-date';
export async function list(actor:AuthUser,query:Record<string,unknown>={}) {
 await expireDueReservations();
 const own=actor.role==='CLIENT';if(!own)db.permit(actor,'reservations.view_all');const args:unknown[]=own?[actor.id]:[];let where=own?'WHERE o.owner_id=?':'WHERE 1=1';
 if(query.status){where+=' AND o.status=?';args.push(v.text(query.status,20));}
 if(query.search){const search=v.text(query.search,100)!;where+=" AND (CAST(o.id AS CHAR) LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)";args.push(...Array(3).fill(`%${search}%`));}
 for(const [key,operator] of [['fromDate','>=' ],['toDate','<=']] as const)if(query[key]){const date=v.text(query[key],10)!;if(!/^\d{4}-\d{2}-\d{2}$/.test(date))v.invalid();where+=` AND DATE(o.created_at)${operator}?`;args.push(date);}
 const orders=await db.rows(`SELECT o.id,o.owner_id AS ownerId,o.status,o.total_cents AS totalCents,o.created_at AS createdAt,o.expires_at AS expiresAt ${own?'':",CONCAT(u.first_name,' ',u.last_name) AS clientName,u.phone,u.email"} FROM client_orders o JOIN users u ON u.id=o.owner_id ${where} ORDER BY o.created_at DESC,o.id DESC LIMIT 101 OFFSET ${(v.queryPage(query)-1)*100}`,args);
 return Promise.all(orders.map(async order=>({...order,items:await Promise.all((await db.rows('SELECT i.product_id AS productId,i.product_name AS name,i.quantity,i.price_cents AS priceCents,p.product_type AS productType,p.image_url AS imageUrl FROM client_order_items i JOIN client_products p ON p.id=i.product_id WHERE i.order_id=?',[order.id])).map(async item=>({...item,imageUrl:await productPhotoUrl(item.imageUrl)})))})));
}
export async function detail(actor:AuthUser,id:string) {
 await expireDueReservations();
 const own=actor.role==='CLIENT';if(!own)db.permit(actor,'reservations.view_all');const result=await db.one(`SELECT o.id,o.owner_id AS ownerId,o.status,o.total_cents AS totalCents,o.created_at AS createdAt,o.expires_at AS expiresAt ${own?'':",CONCAT(u.first_name,' ',u.last_name) AS clientName,u.phone,u.email"} FROM client_orders o JOIN users u ON u.id=o.owner_id WHERE o.id=? ${own?'AND o.owner_id=?':''}`,own?[id,actor.id]:[id]);
 // La reserva ya fue limitada por propietario o por permiso antes de exponer su secuencia de estados.
 const statusHistory=await db.rows("SELECT h.previous_status AS previousStatus,h.new_status AS newStatus,h.occurred_at AS occurredAt,h.reason,CONCAT(u.first_name,' ',u.last_name) AS actorName FROM client_order_status_history h LEFT JOIN users u ON u.id=h.actor_user_id WHERE h.order_id=? ORDER BY h.occurred_at,h.id",[id]);
 // El estado actual y los artículos conservan el contrato anterior, sumando trazabilidad histórica.
 const items=await db.rows('SELECT i.product_id AS productId,i.product_name AS name,i.quantity,i.price_cents AS priceCents,cp.product_type AS productType,cp.image_url AS imageUrl,cp.description AS description,i.pet_id AS petId,p.name AS petName,i.prescription_id AS prescriptionId FROM client_order_items i JOIN client_products cp ON cp.id=i.product_id LEFT JOIN pets p ON p.id=i.pet_id WHERE i.order_id=?',[id]);
 return {...result,id:String(result.id),status:String(result.status),items:await Promise.all(items.map(async item=>({...item,imageUrl:await productPhotoUrl(item.imageUrl)}))),statusHistory};
}
/** Reserva stock bajo lock y usa requestKey para evitar duplicados por reintentos de la misma solicitud. */
export async function create(actor:AuthUser,value:unknown) {
 if(actor.role!=='CLIENT')forbidden();const body=v.body(value,['productId','quantity','petId','prescriptionId','requestKey']);const productId=v.id(body.productId),quantity=v.integer(body.quantity,1,99),petId=v.optionalId(body.petId),prescriptionId=v.optionalId(body.prescriptionId);
 const key=body.requestKey===undefined?randomUUID():v.text(body.requestKey,36)!;if(!/^[a-f0-9-]{36}$/i.test(key))v.invalid();
 const id=await db.transaction(actor,async(c,fresh)=>{if(fresh.role!=='CLIENT')forbidden();const previous=await db.rows('SELECT id FROM client_orders WHERE owner_id=? AND request_key=?',[actor.id,key],c);if(previous[0])return String(previous[0].id);
  // Se bloquea también la clasificación para impedir que se reserve un accesorio publicado como enlace externo.
  const p=await db.one('SELECT id,name,product_type AS productType,stock,reserved_stock AS reservedStock,price_cents AS priceCents,requires_prescription AS requiresPrescription,species_id AS speciesId FROM client_products WHERE id=? AND is_active=1 AND (category_id IS NULL OR EXISTS(SELECT 1 FROM client_product_categories cat WHERE cat.id=client_products.category_id AND cat.is_active=1)) FOR UPDATE',[productId],c);
  // El guard de dominio restringe las reservas a las clasificaciones propias habilitadas.
  assertReservableProduct(String(p.productType));
  if(Number(p.stock)-Number(p.reservedStock)<quantity)throw new AppError('STOCK_UNAVAILABLE',409,'No hay unidades disponibles para reservar.');
  let pet:db.Data|undefined;if(petId)pet=await db.one('SELECT id,species_id AS speciesId FROM pets WHERE id=? AND owner_id=? AND is_active=1',[petId,actor.id],c);
  if(p.speciesId&&(!pet||pet.speciesId!==p.speciesId))v.invalid('Seleccioná una mascota de la especie indicada.');
  // La vigencia la establece el veterinario: no se inventa duración médica.
  if(p.requiresPrescription){if(!petId||!prescriptionId)throw new AppError('PRESCRIPTION_REQUIRED',400,'Seleccioná una receta vigente para ese producto y mascota.');
   await db.one("SELECT r.id FROM client_clinical_records r JOIN pets pet ON pet.id=r.pet_id WHERE r.id=? AND r.pet_id=? AND pet.owner_id=? AND r.product_id=? AND r.kind='prescriptions' AND r.occurred_at<=UTC_TIMESTAMP() AND r.valid_until>UTC_TIMESTAMP()",[prescriptionId,petId,actor.id,productId],c);
  }else if(prescriptionId)v.invalid('Este producto no requiere receta.');
  const promotions=await db.rows('SELECT price_cents AS priceCents FROM client_promotions WHERE product_id=? AND is_active=1 AND starts_at<=UTC_TIMESTAMP() AND ends_at>UTC_TIMESTAMP()',[productId],c);
  const price=Math.min(Number(p.priceCents),...promotions.map(row=>Number(row.priceCents)));
  // MySQL fija creación y vencimiento usando el mismo reloj UTC del servidor.
  await c.execute("INSERT INTO client_orders(owner_id,request_key,total_cents,status,created_at,expires_at) VALUES (?,?,?,'PLACED',UTC_TIMESTAMP(3),TIMESTAMPADD(HOUR,24,UTC_TIMESTAMP(3)))",[actor.id,key,price*quantity]);const order=await db.one('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id',[],c);
  // El evento inicial permite auditar quién solicitó el retiro sin confundirlo con una compra confirmada.
  await c.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id) VALUES (?,NULL,?,?)',[order.id,'PLACED',actor.id]);
  await c.execute('INSERT INTO client_order_items(order_id,product_id,product_name,quantity,price_cents,pet_id,prescription_id) VALUES (?,?,?,?,?,?,?)',[order.id,productId,p.name,quantity,price,petId,prescriptionId]);
  await c.execute('UPDATE client_products SET reserved_stock=reserved_stock+? WHERE id=?',[quantity,productId]);return String(order.id);
 });return detail(actor,id);
}
/** Valida la transición y actualiza stock reservado/físico una sola vez al cancelar o completar el retiro. */
export async function change(actor:AuthUser,id:string,value:unknown) {
 const body=v.body(value,['status','reason']);const status=v.text(body.status,20)!;const reason=status==='CANCELLED'?v.text(body.reason,500):null;if(status==='CANCELLED'&&(!reason||reason.length<3))v.invalid('Ingresá el motivo de rechazo.');if(status!=='CANCELLED'&&body.reason!==undefined)v.invalid();
 const changed=await db.transaction(actor,async(c,fresh)=>{db.permit(fresh,'reservations.manage');const order=await db.one('SELECT id,owner_id AS ownerId,status,expires_at AS expiresAt,expires_at<=UTC_TIMESTAMP(3) AS isExpired FROM client_orders WHERE id=? FOR UPDATE',[id],c);
  if(Boolean(order.isExpired)&&activeReservationStatuses.includes(String(order.status))){const items=await db.rows('SELECT i.product_id AS productId,i.quantity,p.reserved_stock AS reservedStock FROM client_order_items i JOIN client_products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY p.id FOR UPDATE',[id],c);for(const item of items){if(Number(item.reservedStock)<Number(item.quantity))throw new AppError('STOCK_CONFLICT',409,'El stock reservado requiere revisión administrativa.');await c.execute('UPDATE client_products SET reserved_stock=reserved_stock-? WHERE id=?',[item.quantity,item.productId]);}await c.execute("UPDATE client_orders SET status='EXPIRED' WHERE id=? AND status=?",[id,order.status]);await c.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id) VALUES (?,?,?,?)',[id,order.status,'EXPIRED',null]);await db.notify(c,order.ownerId,'La reserva venció','El plazo de retiro terminó y las unidades volvieron al stock.','RESERVATION_EXPIRED','reservation',id,`reservation:${id}:EXPIRED`);return false;}
  assertReservationTransition(String(order.status),status,order.expiresAt?String(order.expiresAt):null);
  const items=await db.rows('SELECT i.product_id AS productId,i.quantity,p.stock,p.reserved_stock AS reservedStock FROM client_order_items i JOIN client_products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY p.id FOR UPDATE',[id],c);
  if(['CANCELLED','COMPLETED'].includes(status)){for(const item of items){if(Number(item.reservedStock)<Number(item.quantity))throw new AppError('STOCK_CONFLICT',409,'El stock reservado requiere revisión administrativa.');
   await c.execute(status==='COMPLETED'?'UPDATE client_products SET stock=stock-?,reserved_stock=reserved_stock-? WHERE id=?':'UPDATE client_products SET reserved_stock=reserved_stock-? WHERE id=?',status==='COMPLETED'?[item.quantity,item.quantity,item.productId]:[item.quantity,item.productId]);
  }}
  // Se persiste la transición validada por assertTransition y se registra simultáneamente su actor.
  await c.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,reason) VALUES (?,?,?,?,?)',[id,order.status,status,fresh.id,reason]);
  // El estado vigente sigue en client_orders para conservar el contrato API y las pantallas existentes.
  await c.execute('UPDATE client_orders SET status=? WHERE id=?',[status,id]);
  // El aviso al propietario se confirma en la misma transacción que el estado de la reserva.
  const deadline=order.expiresAt?formatNotificationDateTime(order.expiresAt):null;
  const eventType=status==='CANCELLED'?'RESERVATION_REJECTED':status==='CONFIRMED'?'RESERVATION_APPROVED':status==='READY'?'RESERVATION_READY':'RESERVATION_UPDATED';
  const title=status==='CANCELLED'?'La reserva fue rechazada':status==='CONFIRMED'?'La reserva fue aprobada':status==='READY'?'Reserva lista para retirar':'Tu reserva fue actualizada';
  const message=status==='CANCELLED'
   ?`La clínica rechazó la reserva ${id}. Motivo: ${reason}`
   :status==='CONFIRMED'
    ?`La clínica aprobó tu reserva ${id}.${deadline?` Retirala antes del ${deadline.date} a las ${deadline.time}.`:''}`
    :status==='READY'
     ?`La reserva ${id} está lista para retirar.${deadline?` Retirala antes del ${deadline.date} a las ${deadline.time}.`:''}`
     :`La clínica actualizó la reserva ${id}. Consultá Mis pedidos para ver su estado.`;
  await db.notify(c,order.ownerId,title,message,eventType,'reservation',id,`reservation:${id}:${order.status}:${status}`);
  return true;
 });if(!changed)throw new AppError('RESERVATION_EXPIRED',409,'La reserva venció y sus unidades fueron liberadas.');return detail(actor,id);
}

/** Vence reservas en lotes pequeños; bloquear el pedido y confirmar EXPIRED hace idempotente la liberación. */
export async function expireDueReservations(batchSize=100):Promise<number> {
 const connection=await databasePool.getConnection();let count=0;
 try {await connection.beginTransaction();
  const [orders]=await connection.execute<(RowDataPacket & {id:string;ownerId:string;status:string})[]>(`SELECT CAST(id AS CHAR) AS id,CAST(owner_id AS CHAR) AS ownerId,status FROM client_orders WHERE status IN ('PLACED','CONFIRMED','PROCESSING','READY') AND expires_at<=UTC_TIMESTAMP(3) ORDER BY expires_at,id LIMIT ? FOR UPDATE SKIP LOCKED`,[Math.max(1,Math.min(500,batchSize))]);
  for(const order of orders){const [updated]=await connection.execute("UPDATE client_orders SET status='EXPIRED' WHERE id=? AND status=? AND expires_at<=UTC_TIMESTAMP(3)",[order.id,order.status]);if((updated as {affectedRows?:number}).affectedRows!==1)continue;
   const [items]=await connection.execute<(RowDataPacket & {productId:string;quantity:number;reservedStock:number})[]>('SELECT i.product_id AS productId,i.quantity,p.reserved_stock AS reservedStock FROM client_order_items i JOIN client_products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY p.id FOR UPDATE',[order.id]);
   for(const item of items){if(Number(item.reservedStock)<Number(item.quantity))throw new AppError('STOCK_CONFLICT',409,'El stock reservado requiere revisión administrativa.');const [stockUpdate]=await connection.execute('UPDATE client_products SET reserved_stock=reserved_stock-? WHERE id=? AND reserved_stock>=?',[item.quantity,item.productId,item.quantity]);if((stockUpdate as {affectedRows?:number}).affectedRows!==1)throw new AppError('STOCK_CONFLICT',409,'No se pudo liberar el stock vencido.');}
   await connection.execute('INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id) VALUES (?,?,?,NULL)',[order.id,order.status,'EXPIRED']);await db.notify(connection,order.ownerId,'La reserva venció','El plazo de retiro terminó y las unidades volvieron al stock.','RESERVATION_EXPIRED','reservation',order.id,`reservation:${order.id}:EXPIRED`);count+=1;
  }
  await connection.commit();return count;
 }catch(error){await connection.rollback();throw error;}finally{connection.release();}
}
