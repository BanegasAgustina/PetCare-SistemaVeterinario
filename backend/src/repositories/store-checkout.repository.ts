import type { RowDataPacket } from 'mysql2/promise';
import { databasePool } from '../config/database';
import { AppError } from '../utils/app-error';
import type { CheckoutAddress, CheckoutPayment } from '../validators/store-checkout.validator';

type Fulfillment = RowDataPacket & { pickupEnabled:number;pickupAddress:string|null;deliveryEnabled:number;deliveryBaseFeeCents:number;freeDeliveryThresholdCents:number|null;bankName:string|null;bankAccountHolder:string|null;bankCbuCvu:string|null;bankAlias:string|null };
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('es');

/** Crea un pedido de tienda idempotente. Valida nuevamente catálogo, precio, envío y configuración bajo transacción. */
export async function create(owner:string,key:string,paymentMethod:CheckoutPayment,method:'PICKUP'|'DELIVERY',address:CheckoutAddress|null,paymentReference:string,transferBuyer?:{name:string;email:string}){
  const connection=await databasePool.getConnection();let orderId='';
  try{
    await connection.beginTransaction();
    await connection.execute('SELECT id FROM users WHERE id=? FOR UPDATE',[owner]);
    const [previous]=await connection.execute<RowDataPacket[]>('SELECT CAST(id AS CHAR) AS id,order_type AS orderType FROM client_orders WHERE owner_id=? AND request_key=?',[owner,key]);
    if(previous[0]){
      if(previous[0].orderType!=='DEMO_PURCHASE'&&previous[0].orderType!=='STORE_PURCHASE')throw new AppError('IDEMPOTENCY_KEY_REUSED',409,'La clave ya corresponde a otro pedido.');
      orderId=String(previous[0].id);
      await connection.commit();
      return orderId;
    }
    const [settingsRows]=await connection.execute<Fulfillment[]>('SELECT pickup_enabled AS pickupEnabled,pickup_address AS pickupAddress,delivery_enabled AS deliveryEnabled,delivery_base_fee_cents AS deliveryBaseFeeCents,free_delivery_threshold_cents AS freeDeliveryThresholdCents,bank_name AS bankName,bank_account_holder AS bankAccountHolder,bank_cbu_cvu AS bankCbuCvu,bank_alias AS bankAlias FROM client_store_fulfillment_settings WHERE id=1 FOR UPDATE');
    const settings=settingsRows[0];
    if(!settings)throw new AppError('STORE_NOT_CONFIGURED',409,'La tienda todavía no tiene configurados los métodos de pago y entrega.');
    if(paymentMethod==='BANK_TRANSFER'&&(!settings.bankName||!settings.bankAccountHolder||!settings.bankCbuCvu||!settings.bankAlias))throw new AppError('STORE_PAYMENT_NOT_CONFIGURED',409,'La tienda todavía no configuró los datos para transferencia bancaria.');
    if(paymentMethod==='BANK_TRANSFER'&&!transferBuyer)throw new AppError('VALIDATION_ERROR',400,'Completá los datos del comprador para iniciar la transferencia.');
    let fee=0;
    if(method==='PICKUP'&&!Boolean(settings.pickupEnabled))throw new AppError('FULFILLMENT_UNAVAILABLE',409,'El retiro en el local no está habilitado.');
    if(method==='PICKUP'&&!settings.pickupAddress?.trim())throw new AppError('FULFILLMENT_NOT_CONFIGURED',409,'El local todavía no configuró la dirección de retiro.');
    if(method==='DELIVERY'){
      if(!Boolean(settings.deliveryEnabled))throw new AppError('FULFILLMENT_UNAVAILABLE',409,'El envío a domicilio no está habilitado.');
      if(!address)throw new AppError('ADDRESS_REQUIRED',400,'Completá la dirección de entrega.');
    }
    const [items]=await connection.execute<RowDataPacket[]>(`SELECT i.product_id AS productId,i.quantity,p.name,p.stock,p.reserved_stock AS reservedStock,
      COALESCE((SELECT MIN(pr.price_cents) FROM client_promotions pr WHERE pr.product_id=p.id AND pr.is_active=1 AND pr.starts_at<=UTC_TIMESTAMP() AND pr.ends_at>UTC_TIMESTAMP() AND pr.price_cents<p.price_cents),p.price_cents) AS priceCents
      FROM client_cart_items i JOIN client_products p ON p.id=i.product_id LEFT JOIN client_product_categories cat ON cat.id=p.category_id
      WHERE i.owner_id=? AND p.is_active=1 AND (cat.id IS NULL OR cat.is_active=1) ORDER BY p.id FOR UPDATE`,[owner]);
    const [countRows]=await connection.execute<RowDataPacket[]>('SELECT COUNT(*) AS total FROM client_cart_items WHERE owner_id=?',[owner]);
    if(!items.length)throw new AppError('CART_EMPTY',409,'El carrito está vacío o sus productos ya no están disponibles.');
    if(Number(countRows[0].total)!==items.length)throw new AppError('CART_ITEMS_UNAVAILABLE',409,'Hay productos del carrito que ya no están disponibles. Revisá el carrito.');
    let subtotal=0;
    for(const item of items){const quantity=Number(item.quantity),available=Number(item.stock)-Number(item.reservedStock),price=Number(item.priceCents);if(!Number.isInteger(quantity)||quantity<1||quantity>99||available<quantity)throw new AppError('STOCK_UNAVAILABLE',409,'El stock cambió. Revisá el carrito antes de continuar.');if(!Number.isSafeInteger(price)||price<0||!Number.isSafeInteger(price*quantity))throw new AppError('PRICE_INVALID',409,'No se pudo validar el precio actual del carrito.');subtotal+=price*quantity;}
    if(!Number.isSafeInteger(subtotal)||subtotal<=0)throw new AppError('PRICE_INVALID',409,'El total del pedido no es válido.');
    if(method==='DELIVERY'&&address){
      const [zones]=await connection.execute<RowDataPacket[]>('SELECT name,province,city,postal_code_prefix AS postalCodePrefix,fee_cents AS feeCents FROM client_store_delivery_zones WHERE is_active=1 ORDER BY province,city,name,id');
      const zone=zones.filter(z=>normalize(String(z.province))===normalize(address.province)&&normalize(String(z.city))===normalize(address.city)&&(!z.postalCodePrefix||address.postalCode.toLocaleUpperCase('es').startsWith(String(z.postalCodePrefix).toLocaleUpperCase('es')))).sort((a,b)=>String(b.postalCodePrefix??'').length-String(a.postalCodePrefix??'').length)[0];
      if(!zone)throw new AppError('DELIVERY_OUTSIDE_ZONE',409,'La dirección está fuera de las zonas de entrega configuradas.');
      const threshold=settings.freeDeliveryThresholdCents===null?null:Number(settings.freeDeliveryThresholdCents);
      fee=threshold!==null&&subtotal>=threshold?0:zone.feeCents===null?Number(settings.deliveryBaseFeeCents):Number(zone.feeCents);
    }
    const total=subtotal+fee;if(!Number.isSafeInteger(total))throw new AppError('PRICE_INVALID',409,'El total del pedido no es válido.');
    const d=method==='DELIVERY'?address:null;
    const isReal=Boolean(transferBuyer);
    await connection.execute(`INSERT INTO client_orders(owner_id,request_key,total_cents,status,created_at,expires_at,order_type,payment_status,is_store_order,store_order_status,store_payment_status,payment_method,fulfillment_method,delivery_status,subtotal_cents,delivery_fee_cents,recipient_name,recipient_phone,delivery_street,delivery_number,delivery_unit,delivery_city,delivery_province,delivery_postal_code,delivery_reference,payment_reference)
      VALUES (?,?,?,'PLACED',UTC_TIMESTAMP(3),TIMESTAMPADD(HOUR,24,UTC_TIMESTAMP(3)),?,?,?, ?,?,?,?, ?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [owner,key,total,isReal?'STORE_PURCHASE':'DEMO_PURCHASE',isReal?'PENDING_VERIFICATION':'DEMO_NOT_PAID',isReal?1:0,isReal?'PLACED':null,isReal?'PENDING':'NOT_APPLICABLE',paymentMethod,method,isReal?'PENDING':'NOT_APPLICABLE',subtotal,fee,d?.recipientName??null,d?.phone??null,d?.street??null,d?.streetNumber??null,d?.unit||null,d?.city??null,d?.province??null,d?.postalCode??null,d?.reference||null,paymentMethod==='BANK_TRANSFER'?paymentReference||null:null]);
    const [created]=await connection.execute<RowDataPacket[]>('SELECT CAST(LAST_INSERT_ID() AS CHAR) AS id');orderId=String(created[0].id);
    if(isReal)await connection.execute('UPDATE client_orders SET payment_reference=? WHERE id=?',[`PEDIDO-${orderId}`,orderId]);
    for(const item of items)await connection.execute('INSERT INTO client_order_items(order_id,product_id,product_name,quantity,price_cents) VALUES (?,?,?,?,?)',[orderId,item.productId,item.name,item.quantity,item.priceCents]);
    await connection.execute("INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,state_type) VALUES (?,NULL,'PLACED',?,'ORDER')",[orderId,owner]);
    if(isReal) await connection.execute("INSERT INTO client_order_status_history(order_id,previous_status,new_status,actor_user_id,state_type) VALUES (?,NULL,'PENDING',?,'PAYMENT')",[orderId,owner]);
    if(transferBuyer)await connection.execute(`INSERT INTO client_store_payment_intents(order_id,owner_id,buyer_name,buyer_email,expires_at)
      VALUES (?,?,?, ?,TIMESTAMPADD(MINUTE,5,UTC_TIMESTAMP(3)))`,[orderId,owner,transferBuyer.name,transferBuyer.email]);
    await connection.execute('DELETE FROM client_cart_items WHERE owner_id=?',[owner]);
    await connection.commit();
  }catch(error){await connection.rollback();throw error;}finally{connection.release();}
  return orderId;
}
