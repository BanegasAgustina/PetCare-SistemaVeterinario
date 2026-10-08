/** Services Cliente usan el request autenticado existente; nunca reciben ownerId. */
import type { Appointment,AppointmentCatalog,Cart,CatalogItem,ClinicalKind,ClinicalRecord,Home,Notification,Order,OrderDetail,Pet,PetCatalog,PetValues,Product,Slot } from '../types/client';
export type ClientRequest=<T>(path:string,options?:{method?:'GET'|'POST'|'PUT'|'PATCH';body?:unknown})=>Promise<T>;
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
    requestAppointment:(petId:string,slotId:string)=>send('/appointments','POST',{petId,slotId}),
    clinical:(kind:ClinicalKind,petId?:string)=>get<ClinicalRecord[]>(`/clinical/${kind}${petId?`?petId=${encodeURIComponent(petId)}`:''}`),
    products:(search='',categoryId?:string)=>get<Product[]>(`/store/products?${new URLSearchParams({search,...(categoryId?{categoryId}:{})})}`),
    product:(id:string)=>get<Product>(`/store/products/${encodeURIComponent(id)}`),categories:()=>get<CatalogItem[]>('/store/categories'),
    cart:()=>get<Cart>('/cart'),updateCart:(id:string,quantity:number)=>send<Cart>(`/cart/${encodeURIComponent(id)}`,'PUT',{quantity}),
    checkout:(requestKey:string)=>send<OrderDetail>('/orders','POST',{requestKey}),orders:()=>get<Order[]>('/orders'),order:(id:string)=>get<OrderDetail>(`/orders/${encodeURIComponent(id)}`),
    notifications:()=>get<Notification[]>('/notifications'),readNotification:(id:string)=>send(`/notifications/${encodeURIComponent(id)}/read`,'PATCH',{}),
    updateProfile:(values:{firstName:string;lastName:string;phone:string})=>send('/profile','PATCH',values),
    changePassword:(currentPassword:string,password:string)=>send('/profile/password','PUT',{currentPassword,password}),
  };
}
