/** Services Cliente usan el request autenticado existente; nunca reciben ownerId. */
import type { Appointment,AppointmentCatalog,Cart,CatalogItem,ClinicalKind,ClinicalRecord,Home,NotificationPage,Order,OrderDetail,Pet,PetCatalog,PetValues,Product,Slot,FulfillmentSettings,DeliveryQuote,PromotionBanner,DeliveryAddress,StoreBanner } from '../types/client';
import type { GeneralInformation } from '../types/admin';
export type ClientRequest=<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown;contentType?:string;headers?:Record<string,string>})=>Promise<T>;
export function clientService(request:ClientRequest){
  const query=<T>(path:string,body:Record<string,unknown>={})=>request<T>(`/client${path}`,{method:'POST',body});
  const send=<T>(path:string,method:'POST'|'PUT'|'PATCH',body:unknown)=>request<T>(`/client${path}`,{method,body});
  return {
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
    clinical:(kind:ClinicalKind,petId?:string)=>query<ClinicalRecord[]>(`/clinical/${kind}`,petId?{petId}:{}),
    products:(search='',categoryId?:string,productType?:'MEDICINE'|'ACCESSORY')=>query<Product[]>('/store/products',{search,...(categoryId?{categoryId}:{}),...(productType?{productType}:{})}),
    product:(id:string)=>query<Product>(`/store/products/${encodeURIComponent(id)}`),categories:()=>query<CatalogItem[]>('/store/categories'),
    fulfillment:()=>query<FulfillmentSettings>('/store/fulfillment'),promotions:()=>query<PromotionBanner[]>('/store/promotions'),banners:()=>query<StoreBanner[]>('/store/banners'),deliveryQuote:(address:{province:string;city:string;postalCode:string;subtotalCents:number})=>query<DeliveryQuote>('/store/delivery-quote',address),deliveryAddresses:()=>query<DeliveryAddress[]>('/store/addresses/query'),saveDeliveryAddress:(body:Omit<DeliveryAddress,'id'>)=>send<DeliveryAddress>('/store/addresses','POST',body),updateDeliveryAddress:(id:string,body:Omit<DeliveryAddress,'id'>)=>send<DeliveryAddress>(`/store/addresses/${encodeURIComponent(id)}`,'PATCH',body),
    cart:()=>query<Cart>('/cart'),updateCart:(id:string,quantity:number)=>send<Cart>(`/cart/${encodeURIComponent(id)}`,'PUT',{quantity}),
    checkout:(input:{requestKey:string;paymentMethod:'BANK_TRANSFER'|'CARD_DEMO';paymentReference?:string;fulfillmentMethod:'PICKUP'|'DELIVERY';address?:{recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string}})=>send<OrderDetail>('/orders','POST',input),
    bankTransferCheckout:(input:{requestKey:string;fulfillmentMethod:'PICKUP'|'DELIVERY';buyerName:string;buyerEmail:string;buyerDni:string;address?:{recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string}})=>send<OrderDetail>('/orders/bank-transfer','POST',input),
    renewTransferIntent:(orderId:string)=>send<OrderDetail>(`/orders/${encodeURIComponent(orderId)}/payment-intents`,'POST',{}),
    uploadPaymentProof:(intentId:string,body:Blob,contentType:string,reference='')=>request<{submitted:boolean}>(`/client/payment-intents/${encodeURIComponent(intentId)}/proof`,{method:'POST',body,contentType,...(reference?{headers:{'X-Payment-Reference':reference}}:{})}),orders:()=>query<Order[]>('/orders/query'),order:(id:string)=>query<OrderDetail>(`/orders/${encodeURIComponent(id)}`),
    notifications:(cursor?:string|null)=>query<NotificationPage>('/notifications',cursor?{cursor}:{}),hideNotification:(id:string)=>request(`/client/notifications/${encodeURIComponent(id)}`,{method:'DELETE',body:{}}),readNotification:(id:string)=>send(`/notifications/${encodeURIComponent(id)}/read`,'PATCH',{}),readAllNotifications:()=>send('/notifications/read-all','PATCH',{}),
    updateProfile:(values:{firstName:string;lastName:string;phone:string})=>send('/profile','PATCH',values),
    changePassword:(currentPassword:string,password:string)=>send('/profile/password','PUT',{currentPassword,password}),
  };
}
