/**
 * ARCHIVO: admin.ts
 * UBICACIÓN: mobile/src/types/admin.ts
 * FUNCIÓN: Tipos y contratos TypeScript.
 * RESPONSABILIDAD: Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de admin.
 * CONEXIONES: Importa: mobile/src/types/auth.ts Se utiliza desde: mobile/src/app/admin/general-information.tsx, mobile/src/app/admin/roles.tsx, mobile/src/app/admin/users/[id].tsx, mobile/src/app/admin/users/index.tsx, mobile/src/components/client/GeneralInformationCard.tsx, mobile/src/services/admin.service.ts, mobile/src/services/client.service.ts
 * FUNCIONAMIENTO: Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/**
 * Define contratos de roles, usuarios y permisos enviados por /admin. Los IDs y permisos proceden de MySQL; estos tipos no autorizan acciones por sí mismos.
 */
import type { AuthUser } from './auth';
/** Rol disponible en administración junto con grants, delegabilidad y cantidad de cuentas asignadas. */
export type AdminRole={id:string;code:AuthUser['role'];name:string;permissions:string[];canAssign:boolean;assignedUsers:number;isActive:boolean};
/** Catálogo de permiso: código, descripción, módulo y restricciones para delegarlo. */
export type AdminPermission={id:string;code:string;name:string;description:string;module:string;moduleName:string;critical:boolean;canDelegate:boolean};
/** Catálogos de roles y permisos que alimentan sus pantallas de administración. */
export type AdminCatalog={roles:AdminRole[];permissions:AdminPermission[]};
/** Vista administrativa de usuario, incluyendo estado de cuenta y verificación. */
export type AdminUser={id:string;firstName:string;lastName:string;email:string;phone:string|null;profilePhotoUrl:string|null;roleId:string;role:AuthUser['role'];roleName:string;isActive:boolean;emailVerified:boolean};
/** Permiso de usuario con origen heredado/override y resultado efectivo calculado por backend. */
export type UserPermission={code:string;name:string;description:string;module:string;inherited:boolean;override:boolean|null;effective:boolean};
/** Perfil administrativo ampliado con permisos e información de invitación. */
export type AdminUserDetail=AdminUser&{permissions:UserPermission[];invitationStatus:string|null;invitationExpiresAt:string|null};
/** Página de resultados con indicadores para paginación de usuarios. */
export type AdminUserPage={items:AdminUser[];page:number;total:number;hasMore:boolean};
/** Módulos visibles del inicio admin y estadísticas de tienda opcionales. */
export type AdminHome={modules:{code:string;name:string;path:string}[];storeStats?:{newOrders:number;preparingOrders:number;pendingDelivery:number;ordersInTransit:number;salesTodayCents:number;ordersToday:number;pendingPayments:number;outOfStockProducts:number;lowStockProducts:number;promotionsExpiring?:number;expiredBanners?:number;scheduledBanners?:number}};
/** Datos públicos configurables de la clínica presentados en tarjetas y sitios informativos. */
export type GeneralInformation={clinicName:string;description:string|null;logoUrl:string|null;welcomeMessage:string|null;phone:string|null;whatsapp:string|null;publicEmail:string|null;address:string|null;city:string|null;province:string|null;mapUrl:string|null;openingHours:OpeningHours;instagramUrl:string|null;facebookUrl:string|null;xUrl:string|null;websiteUrl:string|null;updatedAt:string|null};
/** Claves de día de semana usadas para indexar horarios de apertura. */
export type Weekday='monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
/** Horarios por día, con bandera de apertura y rangos horarios. */
export type OpeningHours=Record<Weekday,{open:boolean;periods:{opensAt:string;closesAt:string}[]}>;
