/**
 * ARCHIVO: admin.service.ts
 * UBICACIÓN: mobile/src/services/admin.service.ts
 * FUNCIÓN: Agrupa las solicitudes HTTP para administración de usuarios, roles, permisos y datos generales.
 * RESPONSABILIDAD: Traducir acciones del hook administrativo a rutas, métodos y cuerpos compatibles con la API.
 * CONEXIONES: Recibe ClientRequest desde mobile/src/services/client.service.ts; usa tipos de mobile/src/types/admin.ts; lo consume mobile/src/hooks/useAdmin.ts. La autorización se valida en el backend.
 * FUNCIONAMIENTO: Construye métodos de consulta y escritura, codifica identificadores de ruta y entrega el resultado tipado de ClientRequest.
 * IMPORTANCIA: Mantiene juntas las operaciones administrativas y deja que las pantallas usen una interfaz de dominio coherente.
 */
/** API administrativa autenticada. Ningún permiso se infiere por email/ID. */
import type { ClientRequest } from './client.service';
import type { AdminCatalog,AdminHome,AdminUserDetail,AdminUserPage,GeneralInformation } from '../types/admin';
/** Crea las operaciones administrativas usando el transporte autenticado que inyecta el hook. */
export function adminService(request:ClientRequest) {
  return {
    // Inicio y catálogo alimentan el resumen, los roles disponibles y los permisos configurables.
    home:()=>request<AdminHome>('/admin/home',{method:'POST',body:{}}),catalog:()=>request<AdminCatalog>('/admin/catalog',{method:'POST',body:{}}),
    // Búsqueda paginada y ficha individual; el estado por defecto incluye cualquier estado de cuenta.
    users:(search:string,page:number,status='all')=>request<AdminUserPage>('/admin/users/query',{method:'POST',body:{search,page:String(page),status}}),
    user:(id:string)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`,{method:'POST',body:{}}),
    // Alta, edición, baja lógica, foto, permisos particulares e invitaciones de usuario.
    createUser:(body:unknown)=>request<{user:AdminUserDetail;invitationDelivery:'sent'|'failed'}>('/admin/users',{method:'POST',body}),
    updateUser:(id:string,body:unknown)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}`,{method:'PUT',body}),
    deactivateUser:(id:string)=>request<{deactivated:true;alreadyInactive:boolean;alreadyDeleted:boolean}>(`/admin/users/${encodeURIComponent(id)}`,{method:'DELETE'}),
    updateUserPhoto:(id:string,body:unknown)=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}/photo`,{method:'PUT',body}),
    userPermissions:(id:string,overrides:{code:string;allowed:boolean|null}[])=>request<AdminUserDetail>(`/admin/users/${encodeURIComponent(id)}/permissions`,{method:'PUT',body:{overrides}}),
    invitation:(id:string)=>request<{delivery:string}>(`/admin/users/${encodeURIComponent(id)}/invitation`,{method:'POST'}),
    // Información institucional y mantenimiento de roles reutilizables.
    generalInformation:()=>request<{information:GeneralInformation;configured:boolean}>('/admin/general-information',{method:'POST',body:{}}),
    saveGeneralInformation:(body:GeneralInformation)=>request<GeneralInformation>('/admin/general-information',{method:'PUT',body}),
    updateRole:(id:string,name:string,permissionCodes:string[])=>request<AdminCatalog>(`/admin/roles/${encodeURIComponent(id)}`,{method:'PUT',body:{name,permissionCodes}}),
    deleteRole:(id:string)=>request<{deleted:boolean}>(`/admin/roles/${encodeURIComponent(id)}`,{method:'DELETE'}),
    createRole:(name:string,permissionCodes:string[])=>request<AdminCatalog>('/admin/roles',{method:'POST',body:{name,permissionCodes}}),
  };
}
