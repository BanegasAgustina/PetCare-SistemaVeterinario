// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne las operaciones relacionadas con este módulo.

import { AppError } from '../utils/app-error';
import { clientBody, requestKey, text, invalid } from './client.validator';
// Tipo CheckoutAddress: define la forma o las opciones válidas de datos usados por este módulo.
export type CheckoutAddress={recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string};
// Tipo CheckoutPayment: define la forma o las opciones válidas de datos usados por este módulo.
export type CheckoutPayment='BANK_TRANSFER'|'CARD_DEMO';
// Función storeCheckoutInput: concentra la lógica dentro de este módulo.
export function storeCheckoutInput(value:unknown){
  const body=clientBody(value,['requestKey','paymentMethod','paymentReference','fulfillmentMethod','address']);
  const key=requestKey(body.requestKey);
  if(body.paymentMethod!=='BANK_TRANSFER'&&body.paymentMethod!=='CARD_DEMO')throw new AppError('PAYMENT_METHOD_UNAVAILABLE',409,'El método de pago no está disponible.');
  const paymentReference=text(body.paymentReference,120,true)??'';
  if(body.paymentMethod==='CARD_DEMO'&&paymentReference)throw new AppError('VALIDATION_ERROR',400,'La simulación no admite referencias de pago.');
  if(body.fulfillmentMethod!=='PICKUP'&&body.fulfillmentMethod!=='DELIVERY')throw new AppError('VALIDATION_ERROR',400,'Elegí un método de entrega.');
  let address:CheckoutAddress|null=null;
  if(body.fulfillmentMethod==='DELIVERY'){
    if(!body.address||typeof body.address!=='object'||Array.isArray(body.address))invalid('Ingresá una dirección completa para el envío.','address');
    const a=clientBody(body.address,['recipientName','phone','street','streetNumber','unit','city','province','postalCode','reference']);
    address={recipientName:checkoutText(a.recipientName,'recipientName','El destinatario',160)!,phone:checkoutText(a.phone,'phone','El teléfono',40)!,street:checkoutText(a.street,'street','La calle',160)!,streetNumber:checkoutText(a.streetNumber,'streetNumber','El número de calle',30)!,unit:checkoutText(a.unit,'unit','El piso o departamento',80,true)??'',city:checkoutText(a.city,'city','La ciudad',100)!,province:checkoutText(a.province,'province','La provincia',100)!,postalCode:checkoutText(a.postalCode,'postalCode','El código postal',16)!,reference:checkoutText(a.reference,'reference','Las referencias',500,true)??''};
  } else if(body.address!==undefined) clientBody(body.address,[]);
  return {key,paymentMethod:body.paymentMethod as CheckoutPayment,paymentReference,fulfillmentMethod:body.fulfillmentMethod as 'PICKUP'|'DELIVERY',address};
}
/** DNI se valida en memoria y se descarta antes de persistir la intención. */
// Función storeTransferInput: concentra la lógica dentro de este módulo.
export function storeTransferInput(value:unknown){
  const body=clientBody(value,['requestKey','fulfillmentMethod','address','buyerName','buyerEmail','buyerDni']);
  const checkout=storeCheckoutInput({requestKey:body.requestKey,paymentMethod:'BANK_TRANSFER',fulfillmentMethod:body.fulfillmentMethod,address:body.address});
  const buyerName=checkoutText(body.buyerName,'buyerName','El nombre del comprador',160)!;
  const buyerEmail=checkoutText(body.buyerEmail,'buyerEmail','El correo electrónico',254)!;
  const dni=typeof body.buyerDni==='string'?body.buyerDni.replace(/[.\s-]/g,''):'';
  if(buyerName.trim().split(/\s+/).length<2)fieldInvalid('buyerName','Ingresá nombre y apellido.');
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail))fieldInvalid('buyerEmail','Ingresá un correo electrónico válido.');
  if(!/^\d{7,9}$/.test(dni))fieldInvalid('buyerDni','El DNI debe contener entre 7 y 9 números.');
  return {...checkout,buyer:{name:buyerName.trim(),email:buyerEmail.trim().toLowerCase()}};
}

// Función checkoutText: comprueba una regla o condición dentro de este módulo.
function checkoutText(value:unknown,field:string,label:string,max:number,optional=false):string|null {
  if(optional&&(value===null||value===undefined||value===''))return null;
  if(typeof value!=='string')fieldInvalid(field,`Ingresá ${label.toLocaleLowerCase('es')}.`);
  const normalized=value.trim();
  if(!normalized&&!optional)fieldInvalid(field,`Ingresá ${label.toLocaleLowerCase('es')}.`);
  if(normalized.length>max)fieldInvalid(field,`${label} admite hasta ${max} caracteres.`);
  return normalized||null;
}

// Función fieldInvalid: concentra la lógica dentro de este módulo.
function fieldInvalid(field:string,message:string):never {
  throw new AppError('VALIDATION_ERROR',400,message,undefined,[{field,message}]);
}
