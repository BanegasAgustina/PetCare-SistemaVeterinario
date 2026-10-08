/**
 * Centraliza los endpoints /clinic y recibe request autenticado como dependencia. Serializa filtros y cambios; no contiene catálogos ni respuestas de negocio locales.
 */
import type { Product,Slot } from '../types/client';
import type { ClientRequest } from './client.service';
import type { ClinicRow,ClinicCatalog,Reservation } from '../types/clinic';
export function clinicService(request:ClientRequest){const get=<T>(path:string)=>request<T>(`/clinic${path}`);const send=<T>(path:string,method:'POST'|'PUT'|'PATCH',body:unknown)=>request<T>(`/clinic${path}`,{method,body});const query=(q:Record<string,string>)=>new URLSearchParams(q).toString();return {
 products:()=>get<Product[]>('/products'),slots:(serviceId:string,professionalId?:string)=>get<Slot[]>(`/slots?${query({serviceId,...(professionalId?{professionalId}:{})})}`),
 home:()=>get<{nextAppointment:ClinicRow|null;todayCount:number|null;pendingCount:number|null;pendingReservations:number|null}>('/home'),catalog:()=>get<ClinicCatalog>('/catalog'),
 appointments:(q:Record<string,string>={})=>get<ClinicRow[]>(`/appointments?${query(q)}`),appointment:(id:string)=>get<ClinicRow>(`/appointments/${encodeURIComponent(id)}`),changeAppointment:(id:string,body:unknown)=>send(`/appointments/${encodeURIComponent(id)}`,'PATCH',body),
 patient:(id:string)=>get<ClinicRow>(`/patients/${encodeURIComponent(id)}`),patients:(search='')=>get<ClinicRow[]>(`/patients?${query({search})}`),records:(id:string,kind:string)=>get<ClinicRow[]>(`/patients/${encodeURIComponent(id)}/records/${encodeURIComponent(kind)}`),saveRecord:(id:string,kind:string,body:unknown)=>send(`/patients/${encodeURIComponent(id)}/records/${encodeURIComponent(kind)}`,'POST',body),
 reservations:(q:Record<string,string>={})=>get<Reservation[]>(`/reservations?${query(q)}`),reservation:(id:string)=>get<Reservation>(`/reservations/${encodeURIComponent(id)}`),reserve:(body:unknown)=>send<Reservation>('/reservations','POST',body),changeReservation:(id:string,status:string)=>send(`/reservations/${encodeURIComponent(id)}`,'PATCH',{status}),
 clients:(search='')=>get<ClinicRow[]>(`/clients?${query({search})}`),client:(id:string)=>get<{client:ClinicRow;pets:ClinicRow[];appointments:ClinicRow[];reservations:ClinicRow[]}>(`/clients/${encodeURIComponent(id)}`),
 assignType:(id:string,typeId:string)=>send(`/professionals/${encodeURIComponent(id)}/type`,'PUT',{typeId}),professionals:()=>get<ClinicRow[]>('/professionals'),assignServices:(id:string,serviceIds:string[])=>send(`/professionals/${encodeURIComponent(id)}/services`,'PUT',{serviceIds}),
 adminList:(kind:string,q:Record<string,string>={})=>get<ClinicRow[]>(`/admin/${kind}?${query(q)}`),adminSave:(kind:string,id:string|undefined,body:unknown)=>send(`/admin/${kind}${id?'/'+encodeURIComponent(id):''}`,id?'PATCH':'POST',body),
 availability:(professionalId:string)=>get<{slots:ClinicRow[];blocks:ClinicRow[]}>(`/availability?${query({professionalId})}`),saveAvailability:(body:unknown)=>send('/availability','POST',body),disableAvailability:(kind:string,id:string)=>send(`/availability/${kind}/${encodeURIComponent(id)}`,'PATCH',{}),
};}
