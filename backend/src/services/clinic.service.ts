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
import { isProductPhotoKey,isServicePhotoKey,removeProductPhoto,removeServicePhoto,storeProductPhoto,storeServicePhoto } from './pet-photo.service';
export async function clinicOperation(actor:AuthUser,operation:string,id:unknown,value:unknown,query:Record<string,unknown>,kind?:string) {
 return runDatabaseOperation(async()=>{switch(operation){
 case 'slots':return clinic.slots(v.id(query.serviceId),query.professionalId?v.id(query.professionalId):undefined);
 // Autoriza lectura con el permiso existente y aplica el texto recibido como filtro del catálogo manual.
 case 'products':{clinic.permit(actor,actor.permissions?.includes('prescriptions.create')?'prescriptions.create':'products.view');const type=v.text(query.productType,20,true);if(type&& !['MEDICINE','ACCESSORY'].includes(type))v.invalid('El filtro debe ser Medicamento o Accesorio.');return client.products(v.text(query.search,100,true)??'',undefined,false,type??undefined);}
 case 'appointment':{const results=await clinic.appointments(actor,{id:v.id(id)});if(!results[0])throw new AppError('NOT_FOUND',404,'Turno no encontrado.');return results[0];}
 case 'home':return clinic.home(actor);
 case 'catalog':return clinic.catalog(actor);
 case 'appointments':return clinic.appointments(actor,query);
 case 'appointment-update':return clinic.changeAppointment(actor,v.id(id),value);
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
 case 'admin-list':return admin.list(actor,admin.entity(kind!),query);
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
 case 'availability':return admin.availability(actor,query);
 case 'availability-save':return admin.saveAvailability(actor,value);
 case 'availability-disable':return admin.disableAvailability(actor,kind!,v.id(id));
 case 'store-fulfillment':return storefront.adminFulfillment(actor);
 case 'store-fulfillment-save':return storefront.saveFulfillment(actor,value);
 case 'store-orders':return storeOrders.list(actor,query);
 case 'store-order':return storeOrders.detail(actor,v.id(id));
 case 'store-order-update':return storeOrders.update(actor,id,value);
 default:v.invalid();
 }});
}
