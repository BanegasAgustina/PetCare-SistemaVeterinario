/** API administrativa autenticada. Ningún permiso se infiere por email/ID. */
import type { ClientRequest } from './client.service';
import type { AdminCatalog,AdminHome,AdminUserDetail,AdminUserPage } from '../types/admin';
export function adminService(request:ClientRequest) {
  return {
    home:()=>request<AdminHome>('/admin/home'),catalog:()=>request<AdminCatalog>('/admin/catalog'),
    users:(search:string,page:number,status='all')=>request<AdminUserPage>(`/admin/users?${new URLSearchParams({search,page:String(page),status})}`),
    user:(id:string)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`),
    createUser:(body:unknown)=>request<{user:AdminUserDetail}>('/admin/users',{method:'POST',body}),
    updateUser:(id:string,body:unknown)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`,{method:'PUT',body}),
    updateUserPhoto:(id:string,body:unknown)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}/photo`,{method:'PUT',body}),
    userPermissions:(id:string,overrides:{code:string;allowed:boolean|null}[])=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}/permissions`,{method:'PUT',body:{overrides}}),
    invitation:(id:string)=>request<{delivery:string}>(`/admin/users/${encodeURIComponent(id)}/invitation`,{method:'POST'}),
    updateRole:(id:string,name:string,permissionCodes:string[])=>request<AdminCatalog>(`/admin/roles/${encodeURIComponent(id)}`,{method:'PUT',body:{name,permissionCodes}}),
    createRole:(name:string,permissionCodes:string[])=>request<AdminCatalog>('/admin/roles',{method:'POST',body:{name,permissionCodes}}),
  };
}
