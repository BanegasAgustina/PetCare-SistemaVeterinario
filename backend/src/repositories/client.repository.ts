/** Todas las consultas personales usan la identidad JWT recibida del controller. */
import type { PoolConnection, RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
import { randomUUID } from 'node:crypto';
import { invalid, type petInput } from '../validators/client.validator';
type PetInput=ReturnType<typeof petInput>;
const petColumns=`p.id,p.name,p.birth_date AS birthDate,p.microchip_number AS microchipNumber,p.species_id AS speciesId,
 p.breed_id AS breedId,s.name AS species,b.name AS breed,d.photo_url AS photoUrl,d.weight_kg AS weightKg`;
const petJoins='FROM pets p JOIN species s ON s.id=p.species_id LEFT JOIN breeds b ON b.id=p.breed_id LEFT JOIN client_pet_details d ON d.pet_id=p.id';
const mapPet=(p:RowDataPacket)=>({...p,id:String(p.id),speciesId:String(p.speciesId),breedId:p.breedId===null?null:String(p.breedId)});
export async function pets(owner:string) {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${petColumns} ${petJoins} WHERE p.owner_id=? AND p.is_active=1 ORDER BY p.name,p.id`,[owner]);return rows.map(mapPet);
}
export async function pet(owner:string,id:string) {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT ${petColumns} ${petJoins} WHERE p.owner_id=? AND p.id=? AND p.is_active=1`,[owner,id]);
  if(!rows[0])throw new AppError('NOT_FOUND',404,'Mascota no encontrada.');return mapPet(rows[0]);
}
export async function petCatalog() {
  const [species]=await databasePool.execute<RowDataPacket[]>('SELECT id,name FROM species ORDER BY name');
  const [breeds]=await databasePool.execute<RowDataPacket[]>('SELECT id,species_id AS speciesId,name FROM breeds ORDER BY name');
  return {species:species.map(s=>({id:String(s.id),name:s.name})),breeds:breeds.map(b=>({id:String(b.id),speciesId:String(b.speciesId),name:b.name}))};
}
async function transaction<T>(operation:(connection:PoolConnection)=>Promise<T>):Promise<T> {
  return runDatabaseOperation(async()=>{const c=await databasePool.getConnection();try{await c.beginTransaction();const result=await operation(c);await c.commit();return result;}catch(error){await c.rollback();throw error;}finally{c.release();}});
}
export async function savePet(owner:string,input:PetInput,id?:string) {
  const petId=await transaction(async c=>{
    const [species]=await c.execute<RowDataPacket[]>('SELECT id FROM species WHERE id=?',[input.speciesId]);if(!species.length)invalid('La especie no existe.');
    if(input.breedId){const [breed]=await c.execute<RowDataPacket[]>('SELECT id FROM breeds WHERE id=? AND species_id=?',[input.breedId,input.speciesId]);if(!breed.length)invalid('La raza no pertenece a la especie.');}
    let result=id;
    if(id){const [rows]=await c.execute<RowDataPacket[]>('SELECT id FROM pets WHERE id=? AND owner_id=? AND is_active=1 FOR UPDATE',[id,owner]);if(!rows.length)throw new AppError('NOT_FOUND',404,'Mascota no encontrada.');
      await c.execute('UPDATE pets SET name=?,species_id=?,breed_id=?,birth_date=?,microchip_number=? WHERE id=? AND owner_id=?',[input.name,input.speciesId,input.breedId,input.birthDate,input.microchipNumber,id,owner]);
    }else{await c.execute('INSERT INTO pets (owner_id,name,species_id,breed_id,birth_date,microchip_number) VALUES (?,?,?,?,?,?)',[owner,input.name,input.speciesId,input.breedId,input.birthDate,input.microchipNumber]);const [rows]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');result=rows[0].id as string;}
    await c.execute('INSERT INTO client_pet_details (pet_id,photo_url,weight_kg) VALUES (?,?,?) ON DUPLICATE KEY UPDATE photo_url=?,weight_kg=?',[result!,input.photoUrl,input.weightKg,input.photoUrl,input.weightKg]);return result!;
  });return pet(owner,petId);
}
export async function deactivatePet(owner:string,id:string) {
  await transaction(async c=>{
    const [rows]=await c.execute<RowDataPacket[]>('SELECT id FROM pets WHERE id=? AND owner_id=? AND is_active=1 FOR UPDATE',[id,owner]);if(!rows.length)throw new AppError('NOT_FOUND',404,'Mascota no encontrada.');
    const [upcoming]=await c.execute<RowDataPacket[]>(`SELECT a.id FROM client_appointments a JOIN client_appointment_slots s ON s.id=a.slot_id
      WHERE a.pet_id=? AND a.status IN ('REQUESTED','CONFIRMED') AND s.starts_at>UTC_TIMESTAMP() LIMIT 1`,[id]);
    if(upcoming.length)throw new AppError('PET_HAS_APPOINTMENTS',409,'La mascota tiene turnos pendientes.');
    await c.execute('UPDATE pets SET is_active=0 WHERE id=? AND owner_id=?',[id,owner]);
  });return {deactivated:true};
}
const appointmentSelect=`SELECT a.id,a.status,(s.starts_at>UTC_TIMESTAMP() AND a.status IN ('REQUESTED','CONFIRMED')) AS isUpcoming,p.name AS petName,p.id AS petId,s.starts_at AS startsAt,s.ends_at AS endsAt,
 sv.name AS service,CONCAT(u.first_name,' ',u.last_name) AS veterinarian
 FROM client_appointments a JOIN pets p ON p.id=a.pet_id JOIN client_appointment_slots s ON s.id=a.slot_id
 JOIN client_services sv ON sv.id=s.service_id JOIN veterinarians v ON v.id=s.veterinarian_id JOIN users u ON u.id=v.user_id`;
export async function appointments(owner:string) {const [rows]=await databasePool.execute<RowDataPacket[]>(`${appointmentSelect} WHERE a.owner_id=? ORDER BY s.starts_at DESC`,[owner]);return rows.map(row=>({...row,id:String(row.id),status:String(row.status),isUpcoming:Boolean(row.isUpcoming),petId:String(row.petId),startsAt:utcDate(row.startsAt),endsAt:utcDate(row.endsAt)}));}
function utcDate(value:unknown):string {return String(value).replace(' ','T')+'Z';}
export async function appointmentCatalog() {
  const [services]=await databasePool.execute<RowDataPacket[]>('SELECT id,name,specialty_id AS specialtyId FROM client_services WHERE is_active=1 ORDER BY name');
  const [specialties]=await databasePool.execute<RowDataPacket[]>('SELECT id,name FROM specialties ORDER BY name');
  const [vets]=await databasePool.execute<RowDataPacket[]>(`SELECT v.id,CONCAT(u.first_name,' ',u.last_name) AS name FROM veterinarians v JOIN users u ON u.id=v.user_id WHERE u.is_active=1 AND u.email_verified_at IS NOT NULL ORDER BY u.last_name`);
  return {services:services.map(r=>({...r,id:String(r.id),specialtyId:r.specialtyId===null?null:String(r.specialtyId)})),specialties:specialties.map(r=>({...r,id:String(r.id)})),veterinarians:vets.map(r=>({...r,id:String(r.id)}))};
}
export async function slots(service:string,veterinarian?:string) {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT s.id,s.veterinarian_id AS veterinarianId,s.starts_at AS startsAt,s.ends_at AS endsAt,
    CONCAT(u.first_name,' ',u.last_name) AS veterinarian FROM client_appointment_slots s JOIN veterinarians v ON v.id=s.veterinarian_id
    JOIN users u ON u.id=v.user_id JOIN client_services sv ON sv.id=s.service_id
    WHERE s.service_id=? AND s.is_active=1 AND sv.is_active=1 AND u.is_active=1 AND u.email_verified_at IS NOT NULL AND s.starts_at>UTC_TIMESTAMP()
    AND NOT EXISTS (SELECT 1 FROM client_appointments a WHERE a.slot_id=s.id) ${veterinarian?'AND s.veterinarian_id=?':''} ORDER BY s.starts_at LIMIT 200`,veterinarian?[service,veterinarian]:[service]);
  return rows.map(r=>({...r,id:String(r.id),veterinarianId:String(r.veterinarianId),startsAt:utcDate(r.startsAt),endsAt:utcDate(r.endsAt)}));
}
export async function createAppointment(owner:string,petId:string,slotId:string) {
  await transaction(async c=>{
    const [owned]=await c.execute<RowDataPacket[]>('SELECT id FROM pets WHERE id=? AND owner_id=? AND is_active=1 FOR UPDATE',[petId,owner]);if(!owned.length)throw new AppError('NOT_FOUND',404,'Mascota no encontrada.');
    const [available]=await c.execute<RowDataPacket[]>(`SELECT s.id FROM client_appointment_slots s JOIN client_services sv ON sv.id=s.service_id
      JOIN veterinarians v ON v.id=s.veterinarian_id JOIN users u ON u.id=v.user_id
      WHERE s.id=? AND s.is_active=1 AND sv.is_active=1 AND u.is_active=1 AND u.email_verified_at IS NOT NULL AND s.starts_at>UTC_TIMESTAMP() FOR UPDATE`,[slotId]);
    if(!available.length)throw new AppError('SLOT_UNAVAILABLE',409,'El horario ya no está disponible.');
    const [booked]=await c.execute<RowDataPacket[]>('SELECT id FROM client_appointments WHERE slot_id=?',[slotId]);if(booked.length)throw new AppError('SLOT_UNAVAILABLE',409,'El horario ya no está disponible.');
    await c.execute('INSERT INTO client_appointments (owner_id,pet_id,slot_id) VALUES (?,?,?)',[owner,petId,slotId]);
  });return {requested:true};
}
export async function clinical(owner:string,kind:string,petId?:string) {
  if(petId)await pet(owner,petId);
  const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT r.id,r.pet_id AS petId,p.name AS petName,r.title,r.content,r.occurred_at AS occurredAt,r.next_due_at AS nextDueAt,
    CONCAT(u.first_name,' ',u.last_name) AS veterinarian FROM client_clinical_records r JOIN pets p ON p.id=r.pet_id
    JOIN veterinarians v ON v.id=r.veterinarian_id JOIN users u ON u.id=v.user_id WHERE p.owner_id=? AND r.kind=? ${petId?'AND p.id=?':''} ORDER BY r.occurred_at DESC`,petId?[owner,kind,petId]:[owner,kind]);
  return rows.map(r=>({...r,id:String(r.id),petId:String(r.petId),occurredAt:utcDate(r.occurredAt),nextDueAt:r.nextDueAt?utcDate(r.nextDueAt):null}));
}
const productSelect=`SELECT p.id,p.name,p.description,p.image_url AS imageUrl,p.category_id AS categoryId,c.name AS category,p.stock,p.is_active AS isActive,p.price_cents AS regularPriceCents,
 COALESCE((SELECT MIN(pr.price_cents) FROM client_promotions pr WHERE pr.product_id=p.id AND pr.is_active=1 AND pr.starts_at<=UTC_TIMESTAMP() AND pr.ends_at>UTC_TIMESTAMP() AND pr.price_cents<p.price_cents),p.price_cents) AS priceCents
 FROM client_products p LEFT JOIN client_product_categories c ON c.id=p.category_id`;
const mapProduct=(r:RowDataPacket)=>({...r,id:String(r.id),isActive:Boolean(r.isActive),stock:Number(r.stock),categoryId:r.categoryId===null?null:String(r.categoryId),priceCents:Number(r.priceCents),regularPriceCents:Number(r.regularPriceCents)});
export async function products(search='',category?:string,featured=false) {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`${productSelect} WHERE p.is_active=1 AND p.name LIKE ? ${category?'AND p.category_id=?':''} ${featured?'AND p.is_featured=1':''} ORDER BY p.name LIMIT 200`,category?[`%${search}%`,category]:[`%${search}%`]);return rows.map(mapProduct);
}
export async function product(id:string) {const [rows]=await databasePool.execute<RowDataPacket[]>(`${productSelect} WHERE p.id=? AND p.is_active=1`,[id]);if(!rows[0])throw new AppError('NOT_FOUND',404,'Producto no encontrado.');return mapProduct(rows[0]);}
export async function categories(){const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id,name FROM client_product_categories ORDER BY name');return rows.map(r=>({...r,id:String(r.id)}));}
export async function cart(owner:string) {
  const [rows]=await databasePool.execute<RowDataPacket[]>(`${productSelect.replace('SELECT p.id','SELECT i.quantity,p.id')} JOIN client_cart_items i ON i.product_id=p.id WHERE i.owner_id=? ORDER BY p.id`,[owner]);
  const items=rows.map(r=>({...mapProduct(r),quantity:Number(r.quantity),subtotalCents:Number(r.quantity)*Number(r.priceCents)}));
  return {items,totalCents:items.reduce((sum,r)=>sum+r.subtotalCents,0),checkoutKey:randomUUID()};
}
export async function updateCart(owner:string,id:string,quantity:number) {
  await transaction(async c=>{
    // Bloquear usuario serializa carrito y checkout del mismo cliente.
    await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[owner]);
    if(!quantity){await c.execute('DELETE FROM client_cart_items WHERE owner_id=? AND product_id=?',[owner,id]);return;}
    const [rows]=await c.execute<RowDataPacket[]>('SELECT stock FROM client_products WHERE id=? AND is_active=1 FOR UPDATE',[id]);
    if(!rows.length||Number(rows[0].stock)<quantity)throw new AppError('STOCK_UNAVAILABLE',409,'No hay stock suficiente.');
    const [count]=await c.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM client_cart_items WHERE owner_id=?',[owner]);
    const [existing]=await c.execute<RowDataPacket[]>('SELECT product_id FROM client_cart_items WHERE owner_id=? AND product_id=?',[owner,id]);
    if(!existing.length&&Number(count[0].total)>=100)invalid('El carrito admite hasta 100 productos distintos.');
    await c.execute('INSERT INTO client_cart_items (owner_id,product_id,quantity) VALUES (?,?,?) ON DUPLICATE KEY UPDATE quantity=?',[owner,id,quantity,quantity]);
  });return cart(owner);
}
export async function orders(owner:string) {const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id,status,total_cents AS totalCents,created_at AS createdAt FROM client_orders WHERE owner_id=? ORDER BY id DESC',[owner]);return rows.map(r=>({...r,id:String(r.id),totalCents:Number(r.totalCents),createdAt:utcDate(r.createdAt)}));}
export async function order(owner:string,id:string) {
  const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id,status,total_cents AS totalCents,created_at AS createdAt FROM client_orders WHERE id=? AND owner_id=?',[id,owner]);if(!rows[0])throw new AppError('NOT_FOUND',404,'Pedido no encontrado.');
  const [items]=await databasePool.execute<RowDataPacket[]>('SELECT product_id AS productId,product_name AS name,quantity,price_cents AS priceCents,quantity*price_cents AS subtotalCents FROM client_order_items WHERE order_id=?',[id]);
  return {...rows[0],id:String(rows[0].id),totalCents:Number(rows[0].totalCents),createdAt:utcDate(rows[0].createdAt),items:items.map(r=>({...r,productId:String(r.productId),priceCents:Number(r.priceCents),subtotalCents:Number(r.subtotalCents)}))};
}
export async function checkout(owner:string,key:string) {
  const id=await transaction(async c=>{
    await c.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[owner]);
    const [previous]=await c.execute<RowDataPacket[]>('SELECT id FROM client_orders WHERE owner_id=? AND request_key=?',[owner,key]);if(previous.length)return String(previous[0].id);
    const [items]=await c.execute<RowDataPacket[]>(`SELECT p.id,p.name,p.is_active,p.stock,p.price_cents,i.quantity FROM client_cart_items i JOIN client_products p ON p.id=i.product_id WHERE i.owner_id=? ORDER BY p.id FOR UPDATE`,[owner]);
    if(!items.length)throw new AppError('CART_EMPTY',400,'Tu carrito está vacío.');
    let total=0;
    for(const item of items){if(!item.is_active||Number(item.stock)<Number(item.quantity))throw new AppError('STOCK_UNAVAILABLE',409,'Un producto ya no tiene stock suficiente.');
      const [promotions]=await c.execute<RowDataPacket[]>('SELECT price_cents FROM client_promotions WHERE product_id=? AND is_active=1 AND starts_at<=UTC_TIMESTAMP() AND ends_at>UTC_TIMESTAMP() ORDER BY price_cents FOR UPDATE',[item.id]);
      item.price_cents=Math.min(Number(item.price_cents),...promotions.map(r=>Number(r.price_cents)));total+=Number(item.price_cents)*Number(item.quantity);
    }
    await c.execute('INSERT INTO client_orders (owner_id,request_key,total_cents) VALUES (?,?,?)',[owner,key,total]);
    const [ids]=await c.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');const orderId=String(ids[0].id);
    for(const item of items){await c.execute('INSERT INTO client_order_items (order_id,product_id,product_name,quantity,price_cents) VALUES (?,?,?,?,?)',[orderId,item.id,item.name,item.quantity,item.price_cents]);await c.execute('UPDATE client_products SET stock=stock-? WHERE id=?',[item.quantity,item.id]);}
    await c.execute('DELETE FROM client_cart_items WHERE owner_id=?',[owner]);return orderId;
  });return order(owner,id);
}
export async function notifications(owner:string){const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id,title,body,read_at AS readAt,created_at AS createdAt FROM client_notifications WHERE owner_id=? ORDER BY id DESC',[owner]);return rows.map(r=>({...r,id:String(r.id),readAt:r.readAt?utcDate(r.readAt):null,createdAt:utcDate(r.createdAt)}));}
export async function readNotification(owner:string,id:string){const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id FROM client_notifications WHERE id=? AND owner_id=?',[id,owner]);if(!rows.length)throw new AppError('NOT_FOUND',404,'Notificación no encontrada.');await databasePool.execute('UPDATE client_notifications SET read_at=COALESCE(read_at,UTC_TIMESTAMP()) WHERE id=? AND owner_id=?',[id,owner]);return {read:true};}
export async function updateProfile(owner:string,firstName:string,lastName:string,phone:string|null){await databasePool.execute('UPDATE users SET first_name=?,last_name=?,phone=? WHERE id=?',[firstName,lastName,phone,owner]);return {updated:true};}
export async function changePassword(owner:string,expectedHash:string,newHash:string){return transaction(async c=>{const [rows]=await c.execute<RowDataPacket[]>('SELECT password_hash FROM users WHERE id=? FOR UPDATE',[owner]);if(rows[0]?.password_hash!==expectedHash)throw new AppError('INVALID_CREDENTIALS',401,'Tu contraseña cambió. Iniciá sesión nuevamente.');await c.execute('UPDATE users SET password_hash=?,session_version=session_version+1 WHERE id=?',[newHash,owner]);return {updated:true};});}
