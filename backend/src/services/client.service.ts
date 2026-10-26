/**
 * Coordina validación y operaciones del cliente usando su identidad autenticada. Delega persistencia al repository y fotos a Cloudinary; un error de consulta nunca se reemplaza por datos de muestra.
 */
import bcrypt from 'bcrypt';
import * as repository from '../repositories/client.repository';
import { findUserById } from '../repositories/user.repository';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
import { env } from '../config/env';
import { storePetPhoto,removePetPhoto,presentServiceImages } from './pet-photo.service';
import { readName,readPhone,readPassword } from '../validators/auth.validator';
import { clientBody,clientId,petInput,cartQuantity,text,invalid } from '../validators/client.validator';
import * as storefront from '../repositories/storefront.repository';
import * as deliveryAddresses from '../repositories/delivery-address.repository';
import * as storeCheckout from '../repositories/store-checkout.repository';
import * as storePayment from '../repositories/store-payment.repository';
import type { AuthUser } from '../types/auth';
import { storePaymentProof,removePaymentProof } from './pet-photo.service';
import { storeCheckoutInput,storeTransferInput } from '../validators/store-checkout.validator';
export const clinicalKinds=['medical-history','vaccines','prescriptions','recommendations'] as const;
export async function clientOperation(owner:string,operation:string,id:unknown,body:unknown,query:Record<string,unknown>,actor?:AuthUser) {
  return runDatabaseOperation(async()=>{
    switch(operation){
      case 'home': {const [pets,appointments,products,unreadNotifications]=await Promise.all([repository.pets(owner),repository.appointments(owner),repository.products('',undefined,true),repository.unreadNotificationCount(owner)]);
        const nextAppointments=appointments.filter(a=>a.isUpcoming&&a.status!=='CANCELLED').sort((a,b)=>String(a.startsAt).localeCompare(String(b.startsAt))).slice(0,8);
        return {pets,nextAppointment:nextAppointments[0]??null,nextAppointments,featuredProducts:products,unreadNotifications};}
      case 'pets':{
        const includeInactive=query.includeInactive==='true';
        if(query.includeInactive!==undefined&&!['true','false'].includes(String(query.includeInactive)))invalid('El filtro de estado de mascotas no es válido.');
        return repository.pets(owner,includeInactive);
      }
      case 'pet-catalog':return repository.petCatalog();
      case 'pet':return repository.pet(owner,clientId(id));
      case 'create-pet':
      case 'update-pet': {
        const petId=operation==='update-pet'?clientId(id):undefined;
        if(petId)await repository.pet(owner,petId);
        const input=petInput(body);
        const values=body as Record<string,unknown>;
        const photo=values.photoBase64===undefined?undefined:await storePetPhoto(owner,values.photoBase64);
        if(photo)input.photoUrl=photo.url;
        // Una URL de visualización enviada por el cliente solo significa conservar.
        // La referencia real se lee bajo lock; nunca se persiste una URL temporal.
        if(!petId&&!photo&&input.photoUrl)invalid('Seleccioná una foto de la galería.');
        let saved:Awaited<ReturnType<typeof repository.savePet>>;
        try {saved=await repository.savePet(owner,input,petId,!photo&&(values.photoUrl===undefined||Boolean(input.photoUrl)));}
        catch(error){if(photo)console.error('Falló el guardado de la mascota; se conserva el objeto nuevo porque el resultado del commit puede ser incierto.');throw error;}
        if(saved.previousPhoto&&saved.previousPhoto!==saved.pet.photoUrl)await removePetPhoto(owner,saved.previousPhoto).catch(()=>console.error('No se pudo eliminar la foto anterior de Cloudinary.'));
        return saved.pet;
      }
      case 'deactivate-pet':clientBody(body,[]);return repository.deactivatePet(owner,clientId(id));
      case 'reactivate-pet':clientBody(body,[]);return repository.reactivatePet(owner,clientId(id));
      case 'appointments':return repository.appointments(owner);
      case 'appointment':{const results=await repository.appointments(owner);const appointment=results.find(item=>item.id===clientId(id));if(!appointment)throw new AppError('NOT_FOUND',404,'Turno no encontrado.');return appointment;}
      case 'appointment-catalog':return presentServiceImages(await repository.appointmentCatalog());
      case 'slots':return repository.slots(clientId(query.serviceId),query.veterinarianId?clientId(query.veterinarianId):undefined);
      case 'create-appointment': {const values=clientBody(body,['petId','slotId']);return repository.createAppointment(owner,clientId(values.petId),clientId(values.slotId),actor);}
      case 'clinical': {if(!clinicalKinds.includes(String(id) as typeof clinicalKinds[number]))invalid();return repository.clinical(owner,String(id),query.petId?clientId(query.petId):undefined);}
      case 'products':{const productType=text(query.productType,20,true);if(productType&&!['MEDICINE','ACCESSORY'].includes(productType))throw new AppError('VALIDATION_ERROR',400,'El tipo de producto no es válido.');return repository.products(text(query.search,200,true)??'',query.categoryId?clientId(query.categoryId):undefined,false,productType??undefined);}
      case 'categories':return repository.categories();
      case 'fulfillment':return storefront.publicFulfillment();
      case 'promotions':return storefront.publicPromotions();
      case 'banners':return storefront.publicBanners();
      case 'delivery-quote':return storefront.quoteDelivery(query);
      case 'delivery-addresses':return deliveryAddresses.list(owner);
      case 'delivery-address-save':return deliveryAddresses.save(owner,body);
      case 'delivery-address-update':return deliveryAddresses.save(owner,body,clientId(id));
      case 'product':return repository.product(clientId(id));
      case 'cart':return repository.cart(owner);
      case 'cart-update':{const values=clientBody(body,['quantity']);return repository.updateCart(owner,clientId(id),cartQuantity(values.quantity));}
      case 'orders':return repository.orders(owner);
      case 'order':return repository.order(owner,clientId(id));
      case 'checkout':{if(!env.storeDemoEnabled)throw new AppError('STORE_DEMO_DISABLED',409,'El modo de demostración de la tienda está desactivado.');const input=storeCheckoutInput(body);const orderId=await storeCheckout.create(owner,input.key,input.paymentMethod,input.fulfillmentMethod,input.address,input.paymentReference);return repository.order(owner,orderId);}
      case 'bank-transfer-checkout':{const input=storeTransferInput(body);const orderId=await storeCheckout.create(owner,input.key,'BANK_TRANSFER',input.fulfillmentMethod,input.address,'',input.buyer);return repository.order(owner,orderId);}
      case 'payment-intent-renew':clientBody(body,[]);await storePayment.createNewIntent(owner,id);return repository.order(owner,clientId(id));
      case 'payment-proof':{
        const input=body as {bytes?:unknown;contentType?:unknown;reference?:unknown};if(!Buffer.isBuffer(input?.bytes)||typeof input.contentType!=='string')throw new AppError('PAYMENT_PROOF_INVALID',400,'Seleccioná un archivo PDF o una imagen válida.');
        const intentId=clientId(id);await storePayment.assertOwnedIntent(owner,intentId);const stored=await storePaymentProof(intentId,input.bytes,input.contentType);
        const reference=text(input.reference,120,true)??undefined;
        try{const old=await storePayment.submitProof(owner,intentId,stored.key,input.contentType,input.bytes.length,reference);if(old.previousKey)await removePaymentProof(old.previousKey).catch(()=>undefined);return {submitted:true};}
        catch(error){await stored.remove().catch(()=>undefined);throw error;}
      }
      case 'notifications':return repository.notifications(owner,query);
      case 'notification-hide':clientBody(body,[]);return repository.hideNotification(owner,clientId(id));
      case 'notification-read':clientBody(body,[]);return repository.readNotification(owner,clientId(id));
      case 'notification-read-all':clientBody(body,[]);return repository.readAllNotifications(owner);
      case 'profile-update':{const values=clientBody(body,['firstName','lastName','phone']);return repository.updateProfile(owner,readName(values.firstName,'El nombre'),readName(values.lastName,'El apellido'),readPhone(values.phone));}
      case 'password-update':{const values=clientBody(body,['currentPassword','password']);const current=readPassword(values.currentPassword,false);const password=readPassword(values.password,true);
        const user=await findUserById(owner);if(!user||!await bcrypt.compare(current,user.passwordHash))throw new AppError('CURRENT_PASSWORD_INVALID',400,'La contraseña actual no es correcta.');
        return repository.changePassword(owner,user.passwordHash,await bcrypt.hash(password,env.bcryptSaltRounds));}
      default:throw new AppError('NOT_FOUND',404,'Recurso no encontrado.');
    }
  });
}
