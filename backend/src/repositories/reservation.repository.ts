/** Reservas para retiro: no procesa pagos ni crea pedidos paralelos. */
import type { AuthUser } from '../types/auth';
import { randomUUID } from 'node:crypto';
import * as db from './clinic.repository';
import * as v from '../validators/clinic.validator';
import { AppError } from '../utils/app-error';
import { assertTransition } from '../utils/clinic-rules';
import { forbidden } from '../utils/admin-authorization';
export async function list(actor:AuthUser,query:Record<string,unknown>={}) {
 const own=actor.role==='CLIENT';if(!own)db.permit(actor,'reservations.view_all');const args:unknown[]=own?[actor.id]:[];let where=own?'WHERE o.owner_id=?':'WHERE 1=1';if(query.status){where+=' AND o.status=?';args.push(v.text(query.status,20));}
 return db.rows(`SELECT o.id,o.owner_id AS ownerId,o.status,o.total_cents AS totalCents,o.created_at AS createdAt ${own?'':",CONCAT(u.first_name,' ',u.last_name) AS clientName,u.phone,u.email"} FROM client_orders o JOIN users u ON u.id=o.owner_id ${where} ORDER BY o.id DESC LIMIT 100 OFFSET ${(v.queryPage(query)-1)*100}`,args);
}
export async function detail(actor:AuthUser,id:string) {
 const own=actor.role==='CLIENT';if(!own)db.permit(actor,'reservations.view_all');const result=await db.one(`SELECT o.id,o.owner_id AS ownerId,o.status,o.total_cents AS totalCents,o.created_at AS createdAt ${own?'':",CONCAT(u.first_name,' ',u.last_name) AS clientName,u.phone,u.email"} FROM client_orders o JOIN users u ON u.id=o.owner_id WHERE o.id=? ${own?'AND o.owner_id=?':''}`,own?[id,actor.id]:[id]);
 return {...result,id:String(result.id),status:String(result.status),items:await db.rows('SELECT i.product_id AS productId,i.product_name AS name,i.quantity,i.price_cents AS priceCents,i.pet_id AS petId,p.name AS petName,i.prescription_id AS prescriptionId FROM client_order_items i LEFT JOIN pets p ON p.id=i.pet_id WHERE i.order_id=?',[id])};
}
export async function create(actor:AuthUser,value:unknown) {
 if(actor.role!=='CLIENT')forbidden();const body=v.body(value,['productId','quantity','petId','prescriptionId','requestKey']);const productId=v.id(body.productId),quantity=v.integer(body.quantity,1,99),petId=v.optionalId(body.petId),prescriptionId=v.optionalId(body.prescriptionId);
 const key=body.requestKey===undefined?randomUUID():v.text(body.requestKey,36)!;if(!/^[a-f0-9-]{36}$/i.test(key))v.invalid();
 const id=await db.transaction(actor,async(c,fresh)=>{if(fresh.role!=='CLIENT')forbidden();const previous=await db.rows('SELECT id FROM client_orders WHERE owner_id=? AND request_key=?',[actor.id,key],c);if(previous[0])return String(previous[0].id);
  const p=await db.one('SELECT id,name,stock,reserved_stock AS reservedStock,price_cents AS priceCents,requires_prescription AS requiresPrescription,species_id AS speciesId FROM client_products WHERE id=? AND is_active=1 AND (category_id IS NULL OR EXISTS(SELECT 1 FROM client_product_categories cat WHERE cat.id=client_products.category_id AND cat.is_active=1)) FOR UPDATE',[productId],c);
  if(Number(p.stock)-Number(p.reservedStock)<quantity)throw new AppError('STOCK_UNAVAILABLE',409,'No hay unidades disponibles para reservar.');
  let pet:db.Data|undefined;if(petId)pet=await db.one('SELECT id,species_id AS speciesId FROM pets WHERE id=? AND owner_id=? AND is_active=1',[petId,actor.id],c);
  if(p.speciesId&&(!pet||pet.speciesId!==p.speciesId))v.invalid('Seleccioná una mascota de la especie indicada.');
  // La vigencia la establece el veterinario: no se inventa duración médica.
  if(p.requiresPrescription){if(!petId||!prescriptionId)throw new AppError('PRESCRIPTION_REQUIRED',400,'Seleccioná una receta vigente para ese producto y mascota.');
   await db.one("SELECT r.id FROM client_clinical_records r JOIN pets pet ON pet.id=r.pet_id WHERE r.id=? AND r.pet_id=? AND pet.owner_id=? AND r.product_id=? AND r.kind='prescriptions' AND r.occurred_at<=UTC_TIMESTAMP() AND r.valid_until>UTC_TIMESTAMP()",[prescriptionId,petId,actor.id,productId],c);
  }else if(prescriptionId)v.invalid('Este producto no requiere receta.');
  const promotions=await db.rows('SELECT price_cents AS priceCents FROM client_promotions WHERE product_id=? AND is_active=1 AND starts_at<=UTC_TIMESTAMP() AND ends_at>UTC_TIMESTAMP()',[productId],c);
  const price=Math.min(Number(p.priceCents),...promotions.map(row=>Number(row.priceCents)));
  await c.execute("INSERT INTO client_orders(owner_id,request_key,total_cents,status) VALUES (?,?,?,'PLACED')",[actor.id,key,price*quantity]);const order=await db.one('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id',[],c);
  await c.execute('INSERT INTO client_order_items(order_id,product_id,product_name,quantity,price_cents,pet_id,prescription_id) VALUES (?,?,?,?,?,?,?)',[order.id,productId,p.name,quantity,price,petId,prescriptionId]);
  await c.execute('UPDATE client_products SET reserved_stock=reserved_stock+? WHERE id=?',[quantity,productId]);return String(order.id);
 });return detail(actor,id);
}
export async function change(actor:AuthUser,id:string,value:unknown) {
 const body=v.body(value,['status']);const status=v.text(body.status,20)!;
 await db.transaction(actor,async(c,fresh)=>{db.permit(fresh,'reservations.manage');const order=await db.one('SELECT id,owner_id AS ownerId,status FROM client_orders WHERE id=? FOR UPDATE',[id],c);assertTransition(String(order.status),status,'reservation');
  const items=await db.rows('SELECT i.product_id AS productId,i.quantity,p.stock,p.reserved_stock AS reservedStock FROM client_order_items i JOIN client_products p ON p.id=i.product_id WHERE i.order_id=? ORDER BY p.id FOR UPDATE',[id],c);
  if(['CANCELLED','COMPLETED'].includes(status)){for(const item of items){if(Number(item.reservedStock)<Number(item.quantity))throw new AppError('STOCK_CONFLICT',409,'El stock reservado requiere revisión administrativa.');
   await c.execute(status==='COMPLETED'?'UPDATE client_products SET stock=stock-?,reserved_stock=reserved_stock-? WHERE id=?':'UPDATE client_products SET reserved_stock=reserved_stock-? WHERE id=?',status==='COMPLETED'?[item.quantity,item.quantity,item.productId]:[item.quantity,item.productId]);
  }}
  await c.execute('UPDATE client_orders SET status=? WHERE id=?',[status,id]);await db.notify(c,order.ownerId,status==='READY'?'Reserva lista para retirar':'Tu reserva fue actualizada',`La clínica actualizó la reserva ${id}. Consultá Mis reservas para ver su estado.`);
 });return detail(actor,id);
}
