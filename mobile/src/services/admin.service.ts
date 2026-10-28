// Este archivo se encarga de lo siguiente: Servicio de la app móvil; agrupa comunicación con la API o manejo de sesión y eventos.

/** API administrativa autenticada. Ningún permiso se infiere por email/ID. */
import type { ClientRequest } from './client.service';
import type { AdminCatalog,AdminHome,AdminUserDetail,AdminUserPage,GeneralInformation } from '../types/admin';
// Función adminService: concentra la lógica dentro de este módulo.
export function adminService(request:ClientRequest) {
  return {
    home:()=>request<AdminHome>('/admin/home',{method:'POST',body:{}}),catalog:()=>request<AdminCatalog>('/admin/catalog',{method:'POST',body:{}}),
    users:(search:string,page:number,status='all')=>request<AdminUserPage>('/admin/users/query',{method:'POST',body:{search,page:String(page),status}}),
    user:(id:string)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`,{method:'POST',body:{}}),
    createUser:(body:unknown)=>request<{user:AdminUserDetail;invitationDelivery:'sent'|'failed'}>('/admin/users',{method:'POST',body}),
    updateUser:(id:string,body:unknown)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`,{method:'PUT',body}),
    updateUserPhoto:(id:string,body:unknown)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}/photo`,{method:'PUT',body}),
    userPermissions:(id:string,overrides:{code:string;allowed:boolean|null}[])=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}/permissions`,{method:'PUT',body:{overrides}}),
    invitation:(id:string)=>request<{delivery:string}>(`/admin/users/${encodeURIComponent(id)}/invitation`,{method:'POST'}),
    generalInformation:()=>request<{information:GeneralInformation;configured:boolean}>('/admin/general-information',{method:'POST',body:{}}),
    saveGeneralInformation:(body:GeneralInformation)=>request<GeneralInformation>('/admin/general-information',{method:'PUT',body}),
    updateRole:(id:string,name:string,permissionCodes:string[])=>request<AdminCatalog>(`/admin/roles/${encodeURIComponent(id)}`,{method:'PUT',body:{name,permissionCodes}}),
    deleteRole:(id:string)=>request<{deleted:boolean}>(`/admin/roles/${encodeURIComponent(id)}`,{method:'DELETE'}),
    createRole:(name:string,permissionCodes:string[])=>request<AdminCatalog>('/admin/roles',{method:'POST',body:{name,permissionCodes}}),
  };
}
