/** Services Cliente usan el request autenticado existente; nunca reciben ownerId. */
import type { Appointment,AppointmentCatalog,Cart,CatalogItem,ClinicalKind,ClinicalRecord,Home,Notification,Order,OrderDetail,Pet,PetCatalog,PetValues,Product,Slot,FulfillmentSettings,DeliveryQuote,PromotionBanner,DeliveryAddress,StoreBanner } from '../types/client';
export type ClientRequest=<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH'|'DELETE';body?:unknown})=>Promise<T>;
export function clientService(request:ClientRequest){
  const get=<T>(path:string)=>request<T>(`/client${path}`);
  const send=<T>(path:string,method:'POST'|'PUT'|'PATCH',body:unknown)=>request<T>(`/client${path}`,{method,body});
  return {
    home:()=>get<Home>('/home'),pets:()=>get<Pet[]>('/pets'),pet:(id:string)=>get<Pet>(`/pets/${encodeURIComponent(id)}`),petCatalog:()=>get<PetCatalog>('/pets/catalog'),
    savePet:(values:PetValues,id?:string)=>send<Pet>(id?`/pets/${encodeURIComponent(id)}`:'/pets',id?'PUT':'POST',{
      ...values,name:values.name.trim(),breedName:values.breedName?.trim()||null,
      microchipNumber:values.microchipNumber.trim()||null,birthDate:values.birthDate||null,
      photoUrl:values.photoUrl||null,weightKg:values.weightKg||null,
    }),deactivatePet:(id:string)=>send(`/pets/${encodeURIComponent(id)}/deactivate`,'PATCH',{}),
    appointments:()=>get<Appointment[]>('/appointments'),appointmentCatalog:()=>get<AppointmentCatalog>('/appointments/catalog'),
    slots:(serviceId:string,veterinarianId?:string)=>get<Slot[]>(`/appointments/slots?${new URLSearchParams({serviceId,...(veterinarianId?{veterinarianId}:{})})}`),
    requestAppointment:(petId:string,slotId:string)=>send<{id:string;status:'REQUESTED'|'CONFIRMED'}>('/appointments','POST',{petId,slotId}),
    clinical:(kind:ClinicalKind,petId?:string)=>get<ClinicalRecord[]>(`/clinical/${kind}${petId?`?petId=${encodeURIComponent(petId)}`:''}`),
    products:(search='',categoryId?:string,productType?:'MEDICINE'|'ACCESSORY')=>get<Product[]>(`/store/products?${new URLSearchParams({search,...(categoryId?{categoryId}:{}),...(productType?{productType}:{})})}`),
    product:(id:string)=>get<Product>(`/store/products/${encodeURIComponent(id)}`),categories:()=>get<CatalogItem[]>('/store/categories'),
    fulfillment:()=>get<FulfillmentSettings>('/store/fulfillment'),promotions:()=>get<PromotionBanner[]>('/store/promotions'),banners:()=>get<StoreBanner[]>('/store/banners'),deliveryQuote:(address:{province:string;city:string;postalCode:string;subtotalCents:number})=>get<DeliveryQuote>(`/store/delivery-quote?${new URLSearchParams({province:address.province,city:address.city,postalCode:address.postalCode,subtotalCents:String(address.subtotalCents)})}`),deliveryAddresses:()=>get<DeliveryAddress[]>('/store/addresses'),saveDeliveryAddress:(body:Omit<DeliveryAddress,'id'>)=>send<DeliveryAddress>('/store/addresses','POST',body),updateDeliveryAddress:(id:string,body:Omit<DeliveryAddress,'id'>)=>send<DeliveryAddress>(`/store/addresses/${encodeURIComponent(id)}`,'PATCH',body),
    cart:()=>get<Cart>('/cart'),updateCart:(id:string,quantity:number)=>send<Cart>(`/cart/${encodeURIComponent(id)}`,'PUT',{quantity}),
    checkout:(input:{requestKey:string;paymentMethod:'BANK_TRANSFER'|'CARD_DEMO';paymentReference?:string;fulfillmentMethod:'PICKUP'|'DELIVERY';address?:{recipientName:string;phone:string;street:string;streetNumber:string;unit:string;city:string;province:string;postalCode:string;reference:string}})=>send<OrderDetail>('/orders','POST',input),orders:()=>get<Order[]>('/orders'),order:(id:string)=>get<OrderDetail>(`/orders/${encodeURIComponent(id)}`),
    notifications:()=>get<Notification[]>('/notifications'),readNotification:(id:string)=>send(`/notifications/${encodeURIComponent(id)}/read`,'PATCH',{}),readAllNotifications:()=>send('/notifications/read-all','PATCH',{}),
    updateProfile:(values:{firstName:string;lastName:string;phone:string})=>send('/profile','PATCH',values),
    changePassword:(currentPassword:string,password:string)=>send('/profile/password','PUT',{currentPassword,password}),
  };
}
