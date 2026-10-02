/** Fixtures exclusivos de tests; no se conectan ni insertan registros en MySQL. */
import assert from 'node:assert/strict';
import { mock,test } from 'node:test';
import type { PoolConnection } from 'mysql2/promise';
import { databasePool } from '../src/config/database';
import { checkout,createAppointment } from '../src/repositories/client.repository';

function harness({stock=10,previous=false,owned=true}={}){
  const writes:{sql:string;values:unknown[]}[]=[];let commits=0;let rollbacks=0;
  const execute=async(sql:string,values:unknown[]=[])=>{
    if(sql.startsWith('SELECT id FROM users'))return [[{id:'1'}]];
    if(sql.startsWith('SELECT id FROM client_orders WHERE owner_id'))return [previous?[{id:'40'}]:[]];
    if(sql.includes('FROM client_cart_items i JOIN'))return [[{id:'2',name:'Producto de test',is_active:1,stock,price_cents:1500,quantity:2}]];
    if(sql.includes('FROM client_promotions'))return [[{price_cents:1200}]];
    if(sql.includes('LAST_INSERT_ID'))return [[{id:'40'}]];
    if(sql.startsWith('SELECT id FROM pets'))return [owned?[{id:'7'}]:[]];
    if(sql.startsWith('SELECT s.id FROM client_appointment_slots'))return [[{id:'9'}]];
    if(sql.startsWith('SELECT id FROM client_appointments'))return [[]];
    writes.push({sql,values});return [[]];
  };
  const c={execute,beginTransaction:async()=>undefined,commit:async()=>{commits++;},rollback:async()=>{rollbacks++;},release:()=>undefined} as unknown as PoolConnection;
  mock.method(databasePool,'getConnection',async()=>c);
  mock.method(databasePool,'execute',async(sql:string)=>sql.includes('FROM client_order_items')?[[{productId:'2',name:'Producto de test',quantity:2,priceCents:1200,subtotalCents:2400}]]:[[{id:'40',status:'PLACED',totalCents:2400,createdAt:'2026-01-01 12:00:00'}]]);
  return {writes,get commits(){return commits;},get rollbacks(){return rollbacks;}};
}
test('checkout usa precio de MySQL, promoción vigente y reserva stock en una transacción',async()=>{
  const h=harness();try{const order=await checkout('1','00000000-0000-4000-8000-000000000001');assert.equal(order.totalCents,2400);
    assert.deepEqual(h.writes.find(w=>w.sql.startsWith('INSERT INTO client_orders'))?.values,['1','00000000-0000-4000-8000-000000000001',2400]);
    assert.deepEqual(h.writes.find(w=>w.sql.startsWith('UPDATE client_products'))?.values,[2,'2']);assert.equal(h.commits,1);assert.equal(h.rollbacks,0);
  }finally{mock.restoreAll();}
});
test('checkout sin stock revierte y no escribe pedido, y reintento con clave previa no duplica',async()=>{
  let h=harness({stock:1});try{await assert.rejects(checkout('1','00000000-0000-4000-8000-000000000001'),{code:'STOCK_UNAVAILABLE'});assert.equal(h.writes.length,0);assert.equal(h.rollbacks,1);}finally{mock.restoreAll();}
  h=harness({previous:true});try{assert.equal((await checkout('1','00000000-0000-4000-8000-000000000001')).id,'40');assert.equal(h.writes.length,0);}finally{mock.restoreAll();}
});
test('solicitar turno rechaza mascota ajena antes de reservar disponibilidad',async()=>{
  const h=harness({owned:false});try{await assert.rejects(createAppointment('1','7','9'),{code:'NOT_FOUND'});assert.equal(h.writes.length,0);assert.equal(h.rollbacks,1);}finally{mock.restoreAll();}
});
