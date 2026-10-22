import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArsToCents, validatePostalCodePrefix, validateStoreFulfillment } from '../src/utils/store-fulfillment-validation';
import { createSubmissionGate } from '../src/utils/submission-gate';

test('shipping fees accept pesos with at most two decimals and reject negative or malformed values',()=>{
 assert.deepEqual(parseArsToCents('1250,50','El costo de envío'),{cents:125050});
 assert.match(parseArsToCents('-1','El costo de envío').error??'',/no puede ser negativo/);
 assert.match(parseArsToCents('12,345','El costo de envío').error??'',/hasta dos decimales/);
 assert.deepEqual(parseArsToCents('','El monto mínimo',true),{cents:null});
});

test('store fulfillment validation identifies missing zone and partial bank fields',()=>{
 const errors=validateStoreFulfillment({pickupEnabled:true,pickupAddress:null,deliveryEnabled:true,zones:[{name:'',province:'',city:'',postalCodePrefix:'12#'}],bankName:'Banco',bankAccountHolder:null,bankCbuCvu:null,bankAlias:null},'-10','',{});
 assert.equal(errors.pickupAddress,'Ingresá la dirección del local para habilitar el retiro.');
 assert.equal(errors.deliveryBaseFeeCents,'El costo de envío no puede ser negativo.');
 assert.equal(errors['zones.0.name'],'Ingresá el nombre de la zona.');
 assert.equal(errors['zones.0.province'],'Ingresá la provincia.');
 assert.equal(errors['zones.0.postalCodePrefix'],'El prefijo postal admite letras, números, espacios y guiones.');
 assert.equal(errors.bankAccountHolder,'Ingresá el titular.');
 assert.equal(errors.bankCbuCvu,'Ingresá el CBU o CVU.');
 assert.equal(errors.bankAlias,'Ingresá el alias.');
});

test('pickup address is required only while pickup is enabled',()=>{
 const errors=validateStoreFulfillment({pickupEnabled:false,pickupAddress:null,deliveryEnabled:true,zones:[],bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null},'0','',{});
 assert.equal(errors.pickupAddress,undefined);
});

test('valid pickup and delivery settings pass frontend validation',()=>{
 const errors=validateStoreFulfillment({pickupEnabled:true,pickupAddress:'Av. Siempre Viva 123',deliveryEnabled:true,zones:[{name:'Centro',province:'Buenos Aires',city:'CABA',postalCodePrefix:'C1425'}],bankName:null,bankAccountHolder:null,bankCbuCvu:null,bankAlias:null},'1250,50','25000',{'zone-0':'500'});
 assert.deepEqual(errors,{});
});

test('postal prefixes accept the backend character and length rules',()=>{
 assert.equal(validatePostalCodePrefix(' C1425 '),undefined);
 assert.equal(validatePostalCodePrefix(''),undefined);
 assert.match(validatePostalCodePrefix('12345678901234567')??'',/hasta 16 caracteres/);
 assert.match(validatePostalCodePrefix('12#34')??'',/letras, números, espacios y guiones/);
});

test('submission gate prevents duplicate requests and unlocks after completion',async()=>{
 const gate=createSubmissionGate();
 let finishFirst!:()=>void;let secondRequests=0;
 const first=gate.run(()=>new Promise<void>(resolve=>{finishFirst=resolve;}));
 assert.equal(await gate.run(async()=>{secondRequests++;}),false);
 finishFirst();assert.equal(await first,true);assert.equal(secondRequests,0);
 assert.equal(await gate.run(async()=>{}),true);
});
