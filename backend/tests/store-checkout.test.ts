import test from 'node:test';
import assert from 'node:assert/strict';
import { databasePool } from '../src/config/database';
import { create } from '../src/repositories/store-checkout.repository';
import { storeCheckoutInput,storeTransferInput } from '../src/validators/store-checkout.validator';

const key='3a3c6736-c93d-4ac4-b699-8d7a812e4eb1';
const address={recipientName:'Ana Cliente',phone:'1112345678',street:'Calle Uno',streetNumber:'10',unit:'',city:'La Plata',province:'Buenos Aires',postalCode:'1900',reference:''};

test('checkout accepts pickup or delivery and rejects card data from the request',()=>{
 assert.equal(storeCheckoutInput({requestKey:key,paymentMethod:'BANK_TRANSFER',fulfillmentMethod:'PICKUP'}).fulfillmentMethod,'PICKUP');
 assert.deepEqual(storeCheckoutInput({requestKey:key,paymentMethod:'BANK_TRANSFER',fulfillmentMethod:'DELIVERY',address}).address,address);
 assert.equal(storeCheckoutInput({requestKey:key,paymentMethod:'CARD_DEMO',fulfillmentMethod:'PICKUP'}).paymentMethod,'CARD_DEMO');
 assert.throws(()=>storeCheckoutInput({requestKey:key,paymentMethod:'CARD',fulfillmentMethod:'PICKUP'}),/método de pago no está disponible/);
 assert.throws(()=>storeCheckoutInput({requestKey:key,paymentMethod:'BANK_TRANSFER',fulfillmentMethod:'DELIVERY',address:{...address,cardNumber:'4111111111111111'}}),/datos ingresados/);
});
test('real transfer validates buyer details and drops DNI before persistence',()=>{
 const input=storeTransferInput({requestKey:key,fulfillmentMethod:'PICKUP',buyerName:'Ana Cliente',buyerEmail:'ana@example.com',buyerDni:'12.345.678'});
 assert.deepEqual(input.buyer,{name:'Ana Cliente',email:'ana@example.com'});assert.equal('buyerDni' in input,false);
 assert.throws(()=>storeTransferInput({requestKey:key,fulfillmentMethod:'PICKUP',buyerName:'Ana',buyerEmail:'ana@example.com',buyerDni:'12345678'}),/nombre y apellido/);
 assert.throws(()=>storeTransferInput({requestKey:key,fulfillmentMethod:'PICKUP',buyerName:'Ana Cliente',buyerEmail:'ana@example.com',buyerDni:'123'}),/DNI válido/);
});

async function withDatabase(handler:(sql:string,params:unknown[])=>unknown[],run:()=>Promise<string>){
 const original=Object.getOwnPropertyDescriptor(databasePool,'getConnection');let committed=false,rolledBack=false,released=false;
 const connection={beginTransaction:async()=>{},commit:async()=>{committed=true;},rollback:async()=>{rolledBack=true;},release:()=>{released=true;},execute:async(sql:string,params:unknown[]=[])=>[handler(sql,params),[]]};
 Object.defineProperty(databasePool,'getConnection',{configurable:true,value:async()=>connection});
 try{return {orderId:await run(),get committed(){return committed;},get rolledBack(){return rolledBack;},get released(){return released;}};}finally{if(original)Object.defineProperty(databasePool,'getConnection',original);else Reflect.deleteProperty(databasePool,'getConnection');}
}

test('delivery checkout recalculates configured zone fee and clears cart only after order commit',async()=>{
 let inserted:unknown[]=[];let cartCleared=false;
 const result=await withDatabase((sql,params)=>{
  if(sql.includes('FROM users'))return [{id:'5'}];
 if(sql.includes('SELECT CAST(id AS CHAR) AS id,order_type'))return [];
  if(sql.includes('FROM client_store_fulfillment_settings'))return [{pickupEnabled:1,pickupAddress:'Local 1',deliveryEnabled:1,deliveryBaseFeeCents:1000,freeDeliveryThresholdCents:null,bankName:'Banco',bankAccountHolder:'Titular',bankCbuCvu:'123',bankAlias:'petcare.alias'}];
  if(sql.includes('FROM client_cart_items i JOIN client_products'))return [{productId:'9',quantity:2,name:'Alimento',stock:5,reservedStock:0,priceCents:2500}];
  if(sql.includes('COUNT(*) AS total FROM client_cart_items'))return [{total:1}];
  if(sql.includes('FROM client_store_delivery_zones'))return [{name:'Centro',province:'Buenos Aires',city:'La Plata',postalCodePrefix:'1900',feeCents:1500}];
  if(sql.includes('INSERT INTO client_orders')){inserted=params;return [];}
  if(sql.includes('LAST_INSERT_ID'))return [{id:'481'}];
  if(sql.includes('INSERT INTO client_order_items'))return [];
  if(sql.includes('INSERT INTO client_order_status_history'))return [];
  if(sql.startsWith('DELETE FROM client_cart_items')){cartCleared=true;return [];}
  assert.fail(`Consulta inesperada: ${sql}`);
 },()=>create('5',key,'CARD_DEMO','DELIVERY',address,''));
 assert.equal(result.orderId,'481');assert.equal(result.committed,true);assert.equal(result.rolledBack,false);assert.equal(result.released,true);assert.equal(cartCleared,true);
 assert.equal(inserted[2],6500,'subtotal plus configured zone fee');assert.equal(inserted[12],1500,'server-computed delivery fee');assert.equal(inserted[9],'DELIVERY');
});

test('checkout retry with the same request key returns the original order without clearing the cart again',async()=>{
 let deleted=false;
 const result=await withDatabase(sql=>{if(sql.includes('SELECT CAST(id AS CHAR) AS id,order_type'))return [{id:'481',orderType:'DEMO_PURCHASE'}];if(sql.includes('FROM users'))return [{id:'5'}];if(sql.startsWith('DELETE FROM client_cart_items')){deleted=true;return [];}return [];},()=>create('5',key,'BANK_TRANSFER','PICKUP',null,''));
 assert.equal(result.orderId,'481');assert.equal(result.committed,true);assert.equal(deleted,false);
});

test('pickup checkout stores no delivery fee and requires no customer address',async()=>{
 let insert:unknown[]=[];
 const result=await withDatabase((sql,params)=>{
  if(sql.includes('FROM users'))return [{id:'5'}];
  if(sql.includes('SELECT CAST(id AS CHAR) AS id,order_type'))return [];
  if(sql.includes('FROM client_store_fulfillment_settings'))return [{pickupEnabled:1,pickupAddress:'Local configurado',deliveryEnabled:0,deliveryBaseFeeCents:0,freeDeliveryThresholdCents:null,bankName:'Banco',bankAccountHolder:'Titular',bankCbuCvu:'123',bankAlias:'petcare.alias'}];
  if(sql.includes('FROM client_cart_items i JOIN client_products'))return [{productId:'9',quantity:1,name:'Alimento',stock:4,reservedStock:0,priceCents:2500}];
  if(sql.includes('COUNT(*) AS total FROM client_cart_items'))return [{total:1}];
  if(sql.includes('INSERT INTO client_orders')){insert=params;return [];}
  if(sql.includes('LAST_INSERT_ID'))return [{id:'482'}];
  return [];
 },()=>create('5','d81468ee-6089-4e6b-9770-2dfac15bc422','CARD_DEMO','PICKUP',null,''));
 assert.equal(result.orderId,'482');assert.equal(insert[9],'PICKUP');assert.equal(insert[12],0);
});

test('checkout refuses to create an order before the administrator configures bank details',async()=>{
 await assert.rejects(withDatabase(sql=>{
  if(sql.includes('FROM users'))return [{id:'5'}];
  if(sql.includes('SELECT CAST(id AS CHAR) AS id,order_type'))return [];
  if(sql.includes('FROM client_store_fulfillment_settings'))return [{pickupEnabled:1,pickupAddress:'Local configurado',deliveryEnabled:0,deliveryBaseFeeCents:0,freeDeliveryThresholdCents:null,bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null}];
  return [];
 },()=>create('5','d81468ee-6089-4e6b-9770-2dfac15bc422','BANK_TRANSFER','PICKUP',null,'')),/datos para transferencia bancaria/);
});

test('demo card can record an unverified order without any bank or card data',async()=>{
 let params:unknown[]=[],insertSql='';
 const result=await withDatabase((sql,values)=>{
  if(sql.includes('FROM users'))return [{id:'5'}];if(sql.includes('SELECT CAST(id AS CHAR) AS id,order_type'))return [];
  if(sql.includes('FROM client_store_fulfillment_settings'))return [{pickupEnabled:1,pickupAddress:'Local',deliveryEnabled:0,deliveryBaseFeeCents:0,freeDeliveryThresholdCents:null,bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null}];
  if(sql.includes('FROM client_cart_items i JOIN client_products'))return [{productId:'9',quantity:1,name:'Alimento',stock:4,reservedStock:0,priceCents:2500}];if(sql.includes('COUNT(*) AS total FROM client_cart_items'))return [{total:1}];
  if(sql.includes('INSERT INTO client_orders')){params=values;insertSql=sql;return [];}if(sql.includes('LAST_INSERT_ID'))return [{id:'483'}];return [];
 },()=>create('5','d81468ee-6089-4e6b-9770-2dfac15bc422','CARD_DEMO','PICKUP',null,''));
 assert.equal(result.orderId,'483');assert.equal(params[3],'DEMO_PURCHASE');assert.equal(params[4],'DEMO_NOT_PAID');assert.equal(params[5],0);assert.equal(params[16],null);assert.doesNotMatch(insertSql,/paymentReference/);
});

test('demo card works with delivery and stores the server-calculated zone fee',async()=>{
 let params:unknown[]=[];
 const result=await withDatabase((sql,values)=>{
  if(sql.includes('FROM users'))return [{id:'5'}];if(sql.includes('SELECT CAST(id AS CHAR) AS id,order_type'))return [];
  if(sql.includes('FROM client_store_fulfillment_settings'))return [{pickupEnabled:0,pickupAddress:null,deliveryEnabled:1,deliveryBaseFeeCents:900,freeDeliveryThresholdCents:null,bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null}];
  if(sql.includes('FROM client_cart_items i JOIN client_products'))return [{productId:'9',quantity:1,name:'Alimento',stock:4,reservedStock:0,priceCents:2500}];if(sql.includes('COUNT(*) AS total FROM client_cart_items'))return [{total:1}];
  if(sql.includes('FROM client_store_delivery_zones'))return [{name:'Zona',province:'Buenos Aires',city:'La Plata',postalCodePrefix:'1900',feeCents:1500}];
  if(sql.includes('INSERT INTO client_orders')){params=values;return [];}if(sql.includes('LAST_INSERT_ID'))return [{id:'484'}];return [];
 },()=>create('5','d81468ee-6089-4e6b-9770-2dfac15bc422','CARD_DEMO','DELIVERY',address,''));
 assert.equal(result.orderId,'484');assert.equal(params[3],'DEMO_PURCHASE');assert.equal(params[8],'CARD_DEMO');assert.equal(params[12],1500);
});

test('real transfer creates a pending store order and persistent five-minute intent without touching stock',async()=>{
 let orderParams:unknown[]=[],intentParams:unknown[]=[],stockChanged=false;
 const result=await withDatabase((sql,params)=>{
  if(sql.includes('FROM users'))return [{id:'5'}];if(sql.includes('SELECT CAST(id AS CHAR) AS id,order_type'))return [];
  if(sql.includes('FROM client_store_fulfillment_settings'))return [{pickupEnabled:1,pickupAddress:'Local',deliveryEnabled:0,deliveryBaseFeeCents:0,freeDeliveryThresholdCents:null,bankName:'Banco',bankAccountHolder:'Titular',bankCbuCvu:'123',bankAlias:'petcare.alias'}];
  if(sql.includes('FROM client_cart_items i JOIN client_products'))return [{productId:'9',quantity:1,name:'Alimento',stock:4,reservedStock:0,priceCents:2500}];if(sql.includes('COUNT(*) AS total FROM client_cart_items'))return [{total:1}];
  if(sql.includes('INSERT INTO client_orders')){orderParams=params;return [];}if(sql.includes('LAST_INSERT_ID'))return [{id:'485'}];if(sql.includes('INSERT INTO client_store_payment_intents')){intentParams=params;return [];}
  if(sql.startsWith('UPDATE client_products'))stockChanged=true;if(sql.startsWith('UPDATE client_cart_items'))stockChanged=true;return [];
 },()=>create('5','e81468ee-6089-4e6b-9770-2dfac15bc422','BANK_TRANSFER','PICKUP',null,'',{name:'Ana Cliente',email:'ana@example.com'}));
 assert.equal(result.orderId,'485');assert.equal(orderParams[3],'STORE_PURCHASE');assert.equal(orderParams[4],'PENDING_VERIFICATION');assert.equal(orderParams[5],1);assert.equal(orderParams[7],'PENDING');assert.equal(intentParams[0],'485');assert.equal(intentParams[2],'Ana Cliente');assert.equal(intentParams[3],'ana@example.com');assert.equal(stockChanged,false);
});
