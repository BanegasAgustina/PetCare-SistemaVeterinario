/**
 * ARCHIVO: client.service.ts
 * UBICACIÓN: mobile/src/services/client.service.ts
 * FUNCIÓN: Expone las operaciones de API que usan las pantallas del cliente.
 * RESPONSABILIDAD: Agrupar consultas y cambios de mascotas, turnos, historia, tienda, pedidos, notificaciones y perfil.
 * CONEXIONES: Importa: mobile/src/types/client.ts, mobile/src/types/admin.ts Se utiliza desde: mobile/src/hooks/useClient.ts, mobile/src/services/admin.service.ts, mobile/src/services/clinic.service.ts
 * FUNCIONAMIENTO: Recibe un transporte autenticado, usa query para consultas POST del dominio y send para escrituras con su método HTTP.
 * IMPORTANCIA: Separa las pantallas del formato de endpoints y centraliza la normalización de datos que se envían, como nombre y campos opcionales de mascota.
 */
/** Services Cliente usan el request autenticado existente; nunca reciben ownerId. */
import type { Appointment,AppointmentCatalog,Cart,CatalogItem,ClinicalKind,ClinicalRecord,Home,NotificationPage,Order,OrderDetail,Pet,PetCatalog,PetValues,Product,Slot,FulfillmentSettings,DeliveryQuote,PromotionBanner,DeliveryAddress,StoreBanner } from '../types/client';
import type { GeneralInformation } from '../types/admin';
/** Contrato del transporte inyectado; apiRequest añade autenticación y manejo uniforme de errores. */
export type ClientRequest=<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown;contentType?:string;headers?:Record<string,string>})=>Promise<T>;
/** Construye las operaciones de cliente; los permisos y la propiedad se comprueban en el servidor. */
export function clientService(request:ClientRequest){
  /** Envía lecturas del dominio cliente como POST y conserva un cuerpo tipado. */
  const query=<T>(path:string,body:Record<string,unknown>={})=>request<T>(`/client${path}`,{method:'POST',body});
  /** Envía escrituras del dominio con el método elegido por cada operación. */
  const send=<T>(path:string,method:'POST'|'PUT'|'PATCH',body:unknown)=>request<T>(`/client${path}`,{method,body});
  return {
    // Mascotas y turnos del usuario autenticado; el servidor determina a qué propietario pertenecen.
    generalInformation:()=>request<GeneralInformation>('/settings/general-information'),
    home:()=>query<Home>('/home'),pets:(includeInactive=false)=>query<Pet[]>('/pets/query',includeInactive?{includeInactive:'true'}:{}),pet:(id:string)=>query<Pet>(`/pets/${encodeURIComponent(id)}`),petCatalog:()=>query<PetCatalog>('/pets/catalog'),
    savePet:(values:PetValues,id?:string)=>send<Pet>(id?`/pets/${encodeURIComponent(id)}`:'/pets',id?'PUT':'POST',{
      ...values,name:values.name.trim(),breedName:values.breedName?.trim()||null,
      microchipNumber:values.microchipNumber.trim()||null,birthDate:values.birthDate||null,
      photoUrl:values.photoUrl||null,weightKg:values.weightKg||null,
    }),deactivatePet:(id:string)=>send(`/pets/${encodeURIComponent(id)}/deactivate`,'PATCH',{}),reactivatePet:(id:string)=>send(`/pets/${encodeURIComponent(id)}/reactivate`,'PATCH',{}),
    appointments:()=>query<Appointment[]>('/appointments/query'),appointment:(id:string)=>query<Appointment>(`/appointments/${encodeURIComponent(id)}`),appointmentCatalog:()=>query<AppointmentCatalog>('/appointments/catalog'),
    slots:(serviceId:string,veterinarianId?:string)=>query<Slot[]>('/appointments/slots',{serviceId,...(veterinarianId?{veterinarianId}:{})}),
    requestAppointment:(petId:string,slotId:string)=>send<{id:string;status:'REQUESTED'|'CONFIRMED'}>('/appointments','POST',{petId,slotId}),
    cancelAppointment:(id:string,reason:string)=>send<{updated:boolean;status:string}>(`/appointments/${encodeURIComponent(id)}/cancel`,'PATCH',{reason}),
    // Historia clínica y catálogo de tienda visibles para el cliente.
    clinical:(kind:ClinicalKind,petId?:string)=>query<ClinicalRecord[]>(`/clinical/${kind}`,petId?{petId}:{}),
    products:(search='',categoryId?:string,productType?:'MEDICINE'|'ACCESSORY')=>query<Product[]>('/store/products',{search,...(categoryId?{categoryId}:{}),...(productType?{productType}:{})}),
    product:(id:string)=>query<Product>(`/store/products/${encodeURIComponent(id)}`),categories:()=>query<CatalogItem[]>('/store/categories'),
    fulfillment:()=>query<FulfillmentSettings>('/store/fulfillment'),promotions:()=>query<PromotionBanner[]>('/store/promotions'),banners:()=>query<StoreBanner[]>('/store/banners'),deliveryQuote:(address:{province:string;city:string;postalCode:string;subtotalCents:number})=>query<DeliveryQuote>('/store/delivery-quote',address),deliveryAddresses:()=>query<DeliveryAddress[]>('/store/addresses/query'),saveDeliveryAddress:(body:Omit<DeliveryAddress,'id'>)=>send<DeliveryAddress>('/store/addresses','POST',body),updateDeliveryAddress:(id:string,body:Omit<DeliveryAddress,'id'>)=>send<DeliveryAddress>(`/store/addresses/${encodeURIComponent(id)}`,'PATCH',body),
    // Carrito, cotización y checkout; la solicitud incluye una clave de idempotencia generada por el flujo.
    cart:()=>query<Cart>('/cart'),updateCart:(id:string,quantity:number)=>send<Cart>(`/cart/${encodeURIComponent(id)}`,'PUT',{quantity}),
    checkout:(input:{requestKey:string;paymentMethod:'BANK_TRANSFER'|'CARD_DEMO';paymentReference?:string;fulfillmentMethod:'PICKUP'|'DELIVERY';address?:{recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string}})=>send<OrderDetail>('/orders','POST',input),
    bankTransferCheckout:(input:{requestKey:string;fulfillmentMethod:'PICKUP'|'DELIVERY';buyerName:string;buyerEmail:string;buyerDni:string;address?:{recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string}})=>send<OrderDetail>('/orders/bank-transfer','POST',input),
    renewTransferIntent:(orderId:string)=>send<OrderDetail>(`/orders/${encodeURIComponent(orderId)}/payment-intents`,'POST',{}),
    uploadPaymentProof:(intentId:string,body:Blob,contentType:string,reference='')=>request<{submitted:boolean}>(`/client/payment-intents/${encodeURIComponent(intentId)}/proof`,{method:'POST',body,contentType,...(reference?{headers:{'X-Payment-Reference':reference}}:{})}),orders:()=>query<Order[]>('/orders/query'),order:(id:string)=>query<OrderDetail>(`/orders/${encodeURIComponent(id)}`),
    // Notificaciones y perfil pertenecen a la cuenta autenticada actual.
    notifications:(cursor?:string|null)=>request<NotificationPage>('/notifications',{method:'POST',body:cursor?{cursor}:{}}),hideNotification:(id:string)=>request(`/notifications/${encodeURIComponent(id)}`,{method:'DELETE',body:{}}),readNotification:(id:string)=>request(`/notifications/${encodeURIComponent(id)}/read`,{method:'PATCH',body:{}}),readAllNotifications:()=>request('/notifications/read-all',{method:'PATCH',body:{}}),
    updateProfile:(values:{firstName:string;lastName:string;phone:string})=>send('/profile','PATCH',values),
    changePassword:(currentPassword:string,password:string)=>send('/profile/password','PUT',{currentPassword,password}),
  };
}
