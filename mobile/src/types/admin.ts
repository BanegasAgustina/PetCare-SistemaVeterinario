/**
 * Define contratos de roles, usuarios y permisos enviados por /admin. Los IDs y permisos proceden de MySQL; estos tipos no autorizan acciones por sí mismos.
 */
import type { AuthUser } from './auth';
export type AdminRole={id:string;code:AuthUser['role'];name:string;permissions:string[];canAssign:boolean;assignedUsers:number};
export type AdminPermission={id:string;code:string;name:string;description:string;module:string;moduleName:string;critical:boolean;canDelegate:boolean};
export type AdminCatalog={roles:AdminRole[];permissions:AdminPermission[]};
export type AdminUser={id:string;firstName:string;lastName:string;email:string;phone:string|null;profilePhotoUrl:string|null;roleId:string;role:AuthUser['role'];roleName:string;isActive:boolean;emailVerified:boolean};
export type UserPermission={code:string;name:string;description:string;module:string;inherited:boolean;override:boolean|null;effective:boolean};
export type AdminUserDetail=AdminUser&{permissions:UserPermission[];invitationStatus:string|null;invitationExpiresAt:string|null};
export type AdminUserPage={items:AdminUser[];page:number;total:number;hasMore:boolean};
export type AdminHome={modules:{code:string;name:string;path:string}[];storeStats?:{newOrders:number;preparingOrders:number;pendingDelivery:number;ordersInTransit:number;salesTodayCents:number;ordersToday:number;pendingPayments:number;outOfStockProducts:number;lowStockProducts:number;promotionsExpiring?:number;expiredBanners?:number;scheduledBanners?:number}};
export type GeneralInformation={clinicName:string;description:string|null;logoUrl:string|null;welcomeMessage:string|null;phone:string|null;whatsapp:string|null;publicEmail:string|null;address:string|null;city:string|null;province:string|null;mapUrl:string|null;openingHours:OpeningHours;instagramUrl:string|null;facebookUrl:string|null;xUrl:string|null;websiteUrl:string|null;updatedAt:string|null};
export type Weekday='monday'|'tuesday'|'wednesday'|'thursday'|'friday'|'saturday'|'sunday';
export type OpeningHours=Record<Weekday,{open:boolean;periods:{opensAt:string;closesAt:string}[]}>;
