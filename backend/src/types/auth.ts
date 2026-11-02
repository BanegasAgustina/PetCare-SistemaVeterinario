/**
 * ARCHIVO: auth.ts
 * UBICACIÓN: backend/src/types/auth.ts
 * FUNCIÓN: Contratos de roles, usuarios, credenciales de entrada y sesión.
 * RESPONSABILIDAD: Compartir modelo autenticado y DTOs entre middleware, servicios y controladores.
 * CONEXIONES: Importa: backend/src/types/authorization.ts Se utiliza desde: backend/src/controllers/auth.controller.ts, backend/src/controllers/client.controller.ts, backend/src/controllers/clinic.controller.ts, backend/src/middlewares/permission.middleware.ts, backend/src/repositories/admin.repository.ts, backend/src/repositories/client.repository.ts, backend/src/repositories/clinic-admin.repository.ts, backend/src/repositories/clinic.repository.ts y 18 más
 * FUNCIONAMIENTO: Declara formas TypeScript de usuario público/almacenado y token Bearer sin transformarlos.
 * IMPORTANCIA: Reduce desajustes entre payload de token, entidades y respuestas de autenticación.
 */
/** Contratos públicos e internos de autenticación; los hashes nunca forman parte del usuario público. */
import type { VetProfile } from './authorization';
/** El código de rol se lee del catálogo de MySQL; los roles especiales conservan sus códigos estables. */
/** Código de rol que usan middleware y servicios de autorización. */
export type RoleCode = string;
/** Usuario público autenticado, sin contraseña ni datos internos de almacenamiento. */
export type AuthUser = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null; role: RoleCode; profilePhotoUrl?:string|null;
  permissions?: string[]; veterinarian?: VetProfile | null;
  roleName?: string;professional?: {typeId:string;name:string;isClinical:boolean;serviceIds:string[]}|null;
};
/** Extensión interna con hash, estado, versión de sesión y rol persistido. */
export type StoredUser = AuthUser & { roleId?:string; passwordHash: string; isActive: boolean; emailVerifiedAt: string | null; sessionVersion: number; mustChangePassword: boolean };
/** DTO de registro después de validar la entrada. */
export type RegisterInput = { firstName: string; lastName: string; email: string; phone: string | null; password: string };
/** Credenciales de login ya validadas. */
export type LoginInput = { email: string; password: string };
/** Respuesta de sesión con usuario y tokens Bearer de acceso/renovación. */
export type AccessSession = { user: AuthUser; accessToken: string; tokenType: 'Bearer'; expiresIn: number; refreshToken: string };
