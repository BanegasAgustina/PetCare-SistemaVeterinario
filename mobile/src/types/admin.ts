// Este archivo se encarga de lo siguiente: Tipos de TypeScript compartidos; describen la forma de los datos que maneja la app.

/**
 * Define contratos de roles, usuarios y permisos enviados por /admin. Los IDs y permisos proceden de MySQL; estos tipos no autorizan acciones por sí mismos.
 */
import type { AuthUser } from './auth';
// Tipo AdminRole: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminRole={id:string;code:AuthUser['role'];name:string;permissions:string[];canAssign:boolean;assignedUsers:number};
// Tipo AdminPermission: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminPermission={id:string;code:string;name:string;description:string;module:string;moduleName:string;critical:boolean;canDelegate:boolean};
// Tipo AdminCatalog: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminCatalog={roles:AdminRole[];permissions:AdminPermission[]};
// Tipo AdminUser: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminUser={id:string;firstName:string;lastName:string;email:string;phone:string|null;profilePhotoUrl:string|null;roleId:string;role:AuthUser['role'];roleName:string;isActive:boolean;emailVerified:boolean};
// Tipo UserPermission: define la forma o las opciones válidas de los datos usados por este módulo.
export type UserPermission={code:string;name:string;description:string;module:string;inherited:boolean;override:boolean|null;effective:boolean};
// Tipo AdminUserDetail: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminUserDetail=AdminUser&{permissions:UserPermission[];invitationStatus:string|null;invitationExpiresAt:string|null};
// Tipo AdminUserPage: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminUserPage={items:AdminUser[];page:number;total:number;hasMore:boolean};
// Tipo AdminHome: define la forma o las opciones válidas de los datos usados por este módulo.
export type AdminHome={modules:{code:string;name:string;path:string}[];storeStats?:{newOrders:number;preparingOrders:number;pendingDelivery:number;ordersInTransit:number;salesTodayCents:number;ordersToday:number;pendingPayments:number;outOfStockProducts:number;lowStockProducts:number;promotionsExpiring?:number;expiredBanners?:number;scheduledBanners?:number}};
// Tipo GeneralInformation: define la forma o las opciones válidas de los datos usados por este módulo.
export type GeneralInformation={clinicName:string;description:string|null;logoUrl:string|null;welcomeMessage:string|null;phone:string|null;whatsapp:string|null;publicEmail:string|null;address:string|null;city:string|null;province:string|null;mapUrl:string|null;openingHours:OpeningHours;instagramUrl:string|null;facebookUrl:string|null;xUrl:string|null;websiteUrl:string|null;updatedAt:string|null};
// Tipo Weekday: define la forma o las opciones válidas de los datos usados por este módulo.
export type Weekday='monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
// Tipo OpeningHours: define la forma o las opciones válidas de los datos usados por este módulo.
export type OpeningHours=Record<Weekday,{open:boolean;periods:{opensAt:string;closesAt:string}[]}>;
