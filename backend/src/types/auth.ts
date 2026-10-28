// Este archivo se encarga de lo siguiente: Tipos de TypeScript que describen datos usados por la aplicación.

/** Contratos públicos e internos de autenticación; los hashes nunca forman parte del usuario público. */
import type { VetProfile } from './authorization';
/** El código de rol se lee del catálogo de MySQL; los roles especiales conservan sus códigos estables. */
// Tipo RoleCode: define la forma o las opciones válidas de datos usados por este módulo.
export type RoleCode = string;
// Tipo AuthUser: define la forma o las opciones válidas de datos usados por este módulo.
export type AuthUser = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null; role: RoleCode; profilePhotoUrl?:string|null;
  permissions?: string[]; veterinarian?: VetProfile | null;
  roleName?: string;professional?: {typeId:string;name:string;isClinical:boolean;serviceIds:string[]}|null;
};
// Tipo StoredUser: define la forma o las opciones válidas de datos usados por este módulo.
export type StoredUser = AuthUser & { passwordHash: string; isActive: boolean; emailVerifiedAt: string | null; sessionVersion: number; mustChangePassword: boolean };
// Tipo RegisterInput: define la forma o las opciones válidas de datos usados por este módulo.
export type RegisterInput = { firstName: string; lastName: string; email: string; phone: string | null; password: string };
// Tipo LoginInput: define la forma o las opciones válidas de datos usados por este módulo.
export type LoginInput = { email: string; password: string };
// Tipo AccessSession: define la forma o las opciones válidas de datos usados por este módulo.
export type AccessSession = { user: AuthUser; accessToken: string; tokenType: 'Bearer'; expiresIn: number; refreshToken: string };
