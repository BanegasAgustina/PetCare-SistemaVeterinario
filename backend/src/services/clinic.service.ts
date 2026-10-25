/** Servicios comparten repositories: cliente, profesional y secretaría leen las mismas filas. */
import type { AuthUser } from '../types/auth';
import * as client from '../repositories/client.repository';
import * as clinic from '../repositories/clinic.repository';
import * as reservations from '../repositories/reservation.repository';
import * as admin from '../repositories/clinic-admin.repository';
import * as storefront from '../repositories/storefront.repository';
import * as storeOrders from '../repositories/store-orders.repository';
import * as v from '../validators/clinic.validator';
import { runDatabaseOperation } from '../utils/database-error';
import { AppError } from '../utils/app-error';
import { isBannerPhotoKey,isProductPhotoKey,isServicePhotoKey,presentServiceImages,removeBannerPhoto,removeProductPhoto,removeServicePhoto,storeBannerPhoto,storeProductPhoto,storeServicePhoto } from './pet-photo.service';
export async function clinicOperation(actor:AuthUser,operation:string,id:unknown,value:unknown,query:Record<string,unknown>,kind?:string) {
 return runDatabaseOperation(async()=>{switch(operation){
 case 'slots':return clinic.slots(v.id(query.serviceId),query.professionalId?v.id(query.professionalId):undefined);
 // Autoriza lectura con el permiso existente y aplica el texto recibido como filtro del catálogo manual.
 case 'products':{if(!['products.view','prescriptions.create','recommendations.create'].some(permission=>actor.permissions?.includes(permission)))throw new AppError('FORBIDDEN',403,'No tenés permiso para consultar el catálogo de productos.');const type=v.text(query.productType,20,true);if(type&& !['MEDICINE','ACCESSORY'].includes(type))v.invalid('El filtro debe ser Medicamento o Accesorio.');return client.products(v.text(query.search,100,true)??'',query.categoryId?v.id(query.categoryId):undefined,false,type??undefined);}
 case 'appointment':{const results=await clinic.appointments(actor,{id:v.id(id)});if(!results[0])throw new AppError('NOT_FOUND',404,'Turno no encontrado.');return results[0];}
 case 'home':return clinic.home(actor);
 case 'catalog':return clinic.catalog(actor);
 case 'appointments':return clinic.appointments(actor,query);
 case 'appointment-update':return clinic.changeAppointment(actor,v.id(id),value);
 case 'grooming-record':return clinic.groomingRecord(actor,v.id(id));
 case 'grooming-record-save':return clinic.saveGroomingRecord(actor,v.id(id),value);
 case 'patient':return clinic.patient(actor,v.id(id));
 case 'patient-update':return clinic.updatePatient(actor,v.id(id),value);
 case 'patient-deactivate':return clinic.deactivatePatient(actor,v.id(id));
 case 'patients':return clinic.patients(actor,v.text(query.search,100,true)??'',v.text(query.sort,20,true)??'recent',v.text(query.speciesId,20,true)??undefined);
 case 'clinical':return clinic.clinical(actor,v.id(id),kind!);
 case 'clinical-create':return clinic.saveClinical(actor,v.id(id),kind!,value);
 case 'clients':return clinic.clients(actor,v.text(query.search,100,true)??'');
 case 'client':return clinic.clientDetails(actor,v.id(id));
 case 'reservations':return reservations.list(actor,query);
 case 'reservation':return reservations.detail(actor,v.id(id));
 case 'reservation-create':return reservations.create(actor,value);
 case 'reservation-update':return reservations.change(actor,v.id(id),value);
 case 'professionals':admin.administrative(actor);clinic.permit(actor,'professionals.manage');return clinic.professionals();
 case 'professional-type':return admin.assignType(actor,v.id(id),value);
 case 'professional-services':return admin.assignServices(actor,v.id(id),value);
 case 'admin-list':{const entity=admin.entity(kind!);const result=await admin.list(actor,entity,query);return entity==='services'?presentServiceImages(result):result;}
 case 'admin-save':{
  const entity=admin.entity(kind!);const record=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;
  if(!record||!['products','services'].includes(entity))return admin.save(actor,entity,id===undefined?undefined:v.id(id),value);
  if(entity==='services'){
   const previousKey=(await admin.save(actor,entity,id===undefined?undefined:v.id(id),Object.fromEntries(Object.entries(record).filter(([key])=>key!=='photoBase64')))) as {previousImage?:unknown};
   if(record.photoBase64===undefined){if(record.imageUrl!==undefined&&record.imageUrl!==previousKey.previousImage&&isServicePhotoKey(previousKey.previousImage))await removeServicePhoto(previousKey.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del servicio.'));return {saved:true};}
   if(!actor.permissions?.includes('services.manage'))throw new AppError('FORBIDDEN',403,'No tenés permiso para modificar imágenes de servicios.');
   const image=await storeServicePhoto(record.photoBase64);
   try {await admin.save(actor,entity,id===undefined?undefined:v.id(id),{...Object.fromEntries(Object.entries(record).filter(([key])=>key!=='photoBase64')),imageUrl:image.url});if(previousKey.previousImage!==image.url&&isServicePhotoKey(previousKey.previousImage))await removeServicePhoto(previousKey.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del servicio.'));return {saved:true};}
   catch(error){await image.remove().catch(()=>console.error('No se pudo limpiar una imagen de servicio sin referencia.'));throw error;}
  }
  if(record.photoBase64===undefined){const saved=await admin.save(actor,entity,id===undefined?undefined:v.id(id),value);const previous=(saved as {previousImage?:unknown}).previousImage;if(record.imageUrl!==undefined&&record.imageUrl!==previous&&isProductPhotoKey(previous))await removeProductPhoto(previous).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {saved:true};}
  if(!actor.permissions?.includes('products.update'))throw new AppError('FORBIDDEN',403,'No tenés permiso para modificar imágenes de productos.');
  const {photoBase64,...fields}=record;const image=await storeProductPhoto(photoBase64);
  try {const saved=await admin.save(actor,entity,id===undefined?undefined:v.id(id),{...fields,imageUrl:image.url});const previous=(saved as {previousImage?:unknown}).previousImage;if(previous!==image.url&&isProductPhotoKey(previous))await removeProductPhoto(previous).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {saved:true};}
  catch(error){await image.remove().catch(()=>console.error('No se pudo limpiar una imagen de producto sin referencia.'));throw error;}
 }
 case 'admin-delete':{
  const entity=admin.entity(kind!);
  if(entity!=='services')v.invalid();
  const removed=await admin.deleteService(actor,v.id(id));
  if(removed.deleted&&isServicePhotoKey(removed.imageUrl))await removeServicePhoto(removed.imageUrl).catch(()=>console.error('No se pudo limpiar la imagen del servicio eliminado.'));
  return {deleted:removed.deleted,archived:removed.archived};
 }
 case 'availability':return admin.availability(actor,query);
 case 'availability-save':return admin.saveAvailability(actor,value);
 case 'availability-archive':return admin.archiveAvailability(actor,kind!,v.id(id));
 case 'availability-disable':{
  const state=v.body(value,['isActive']).isActive;
  if(typeof state!=='boolean')v.invalid('Indicá si querés activar o desactivar la disponibilidad.');
  return admin.setAvailabilityActive(actor,kind!,v.id(id),state);
 }
 case 'store-fulfillment':return storefront.adminFulfillment(actor);
 case 'store-fulfillment-save':return storefront.saveFulfillment(actor,value);
 case 'store-banners':return storefront.adminBanners(actor);
 case 'store-banners-order':return storefront.reorderBanners(actor,value);
 case 'store-banner-create':
 case 'store-banner-save':{
  const record=value&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:{};
  const {mobilePhotoBase64,desktopPhotoBase64,...fields}=record;
  if(mobilePhotoBase64===undefined&&desktopPhotoBase64===undefined)return storefront.saveBanner(actor,id,fields);
  if(!actor.permissions?.includes('store.banners.manage'))throw new AppError('FORBIDDEN',403,'No tenés permiso para modificar banners.');
  const mobilePhoto=mobilePhotoBase64===undefined?null:await storeBannerPhoto(mobilePhotoBase64);
  let desktopPhoto:Awaited<ReturnType<typeof storeBannerPhoto>>|null=null;
  try {
   if(desktopPhotoBase64!==undefined)desktopPhoto=await storeBannerPhoto(desktopPhotoBase64);
   const saved=await storefront.saveBanner(actor,operation==='store-banner-create'?undefined:id,{...fields,...(mobilePhoto?{mobileImageUrl:mobilePhoto.url}:{}),...(desktopPhoto?{desktopImageUrl:desktopPhoto.url}:{})});
   const previous=(saved as {previous?:{mobileImageUrl:string;desktopImageUrl:string|null}}).previous;
   if(previous){for(const oldImage of [previous.mobileImageUrl,previous.desktopImageUrl])if(oldImage&&isBannerPhotoKey(oldImage)&&oldImage!==(mobilePhoto?.url??fields.mobileImageUrl)&&oldImage!==(desktopPhoto?.url??fields.desktopImageUrl))await removeBannerPhoto(oldImage).catch(()=>console.error('No se pudo limpiar una imagen anterior del banner.'));}
   return saved;
  }catch(error){await mobilePhoto?.remove().catch(()=>console.error('No se pudo limpiar la imagen nueva del banner.'));await desktopPhoto?.remove().catch(()=>console.error('No se pudo limpiar la imagen nueva del banner.'));throw error;}
 }
 case 'store-banner-delete':{const removed=await storefront.removeBanner(actor,id);for(const image of [removed.mobileImageUrl,removed.desktopImageUrl])if(image&&isBannerPhotoKey(image))await removeBannerPhoto(image).catch(()=>console.error('No se pudo limpiar la imagen del banner eliminado.'));return {deleted:true};}
 case 'store-orders':return storeOrders.list(actor,query);
 case 'store-order':return storeOrders.detail(actor,v.id(id));
 case 'store-order-update':return storeOrders.update(actor,id,value);
 case 'store-order-proof':return storeOrders.proof(actor,v.id(id));
 case 'store-order-payment-review':return storeOrders.reviewPayment(actor,v.id(id),value);
 default:v.invalid();
 }});
}
