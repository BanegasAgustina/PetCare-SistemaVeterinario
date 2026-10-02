import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { clientBody,clientId,cartQuantity,requestKey,petInput } from '../src/validators/client.validator';
import { assertSupportedMysqlVersion } from '../src/services/database.service';
test('compatibilidad acepta MySQL real 9.7 sin perder requisitos CHECK de MySQL 8',()=>{
  for(const version of ['8.0.16','8.4.0','9.7.2'])assert.doesNotThrow(()=>assertSupportedMysqlVersion(version));
  for(const version of ['5.7.44','8.0.15','10.11.0-MariaDB','9.7.2-MariaDB','texto'])assert.throws(()=>assertSupportedMysqlVersion(version),{code:'DB_VERSION_UNSUPPORTED'});
});
test('cliente rechaza identidad, precios y campos inesperados enviados libremente',()=>{
  assert.throws(()=>clientBody({ownerId:'15',quantity:1},['quantity']),{code:'VALIDATION_ERROR'});
  assert.throws(()=>clientBody({quantity:1,priceCents:1},['quantity']),{code:'VALIDATION_ERROR'});
  assert.throws(()=>clientBody({userId:'15',petId:'1',slotId:'1'},['petId','slotId']),{code:'VALIDATION_ERROR'});
  for(const value of ['0','1 OR 1=1','-1',1])assert.throws(()=>clientId(value),{code:'VALIDATION_ERROR'});
});
test('cantidades y claves de checkout son acotadas e idempotentes',()=>{
  assert.equal(cartQuantity(0),0);assert.equal(cartQuantity(99),99);
  for(const value of [-1,100,1.5,'1',null])assert.throws(()=>cartQuantity(value),{code:'VALIDATION_ERROR'});
  const key=randomUUID();assert.equal(requestKey(key),key);assert.throws(()=>requestKey('corto'),{code:'VALIDATION_ERROR'});
});
test('mascotas validan fechas reales, peso y URLs sin inventar campos',()=>{
  const values={name:'Mascota de prueba',speciesId:'1'};
  assert.equal(petInput(values).breedId,null);
  for(const change of [{birthDate:'2026-02-30'},{birthDate:'2999-01-01'},{photoUrl:'http://example.com/photo.png'},{photoUrl:'https://user:password@example.com/photo.png'},{weightKg:-1},{weightKg:1.234},{ownerId:'999'}])assert.throws(()=>petInput({...values,...change}),{code:'VALIDATION_ERROR'});
});
