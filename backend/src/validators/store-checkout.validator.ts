import { AppError } from '../utils/app-error';
import { clientBody, requestKey, text } from './client.validator';
export type CheckoutAddress={recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string};
export type CheckoutPayment='BANK_TRANSFER'|'CARD_DEMO';
export function storeCheckoutInput(value:unknown){
  const body=clientBody(value,['requestKey','paymentMethod','paymentReference','fulfillmentMethod','address']);
  const key=requestKey(body.requestKey);
  if(body.paymentMethod!=='BANK_TRANSFER'&&body.paymentMethod!=='CARD_DEMO')throw new AppError('PAYMENT_METHOD_UNAVAILABLE',409,'El método de pago no está disponible.');
  const paymentReference=text(body.paymentReference,120,true)??'';
  if(body.paymentMethod==='CARD_DEMO'&&paymentReference)throw new AppError('VALIDATION_ERROR',400,'La simulación no admite referencias de pago.');
  if(body.fulfillmentMethod!=='PICKUP'&&body.fulfillmentMethod!=='DELIVERY')throw new AppError('VALIDATION_ERROR',400,'Elegí un método de entrega.');
  let address:CheckoutAddress|null=null;
  if(body.fulfillmentMethod==='DELIVERY'){
    const a=clientBody(body.address,['recipientName','phone','street','streetNumber','unit','city','province','postalCode','reference']);
    address={recipientName:text(a.recipientName,160)!,phone:text(a.phone,40)!,street:text(a.street,160)!,streetNumber:text(a.streetNumber,30)!,unit:text(a.unit,80,true)??'',city:text(a.city,100)!,province:text(a.province,100)!,postalCode:text(a.postalCode,16)!,reference:text(a.reference,500,true)??''};
  } else if(body.address!==undefined) clientBody(body.address,[]);
  return {key,paymentMethod:body.paymentMethod as CheckoutPayment,paymentReference,fulfillmentMethod:body.fulfillmentMethod as 'PICKUP'|'DELIVERY',address};
}
