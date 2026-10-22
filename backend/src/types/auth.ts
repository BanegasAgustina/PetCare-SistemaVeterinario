/** Contratos públicos e internos de autenticación; los hashes nunca forman parte del usuario público. */
import type { VetProfile } from './authorization';
/** El código de rol se lee del catálogo de MySQL; los roles especiales conservan sus códigos estables. */
export type RoleCode = string;
export type AuthUser = {
  id: string; firstName: string; lastName: string; email: string; phone: string | null; role: RoleCode; profilePhotoUrl?:string|null;
  permissions?: string[]; veterinarian?: VetProfile | null;
  roleName?: string;professional?: {typeId:string;name:string;isClinical:boolean;serviceIds:string[]}|null;
};
export type StoredUser = AuthUser & { passwordHash: string; isActive: boolean; emailVerifiedAt: string | null; sessionVersion: number; mustChangePassword: boolean };
export type RegisterInput = { firstName: string; lastName: string; email: string; phone: string | null; password: string };
export type LoginInput = { email: string; password: string };
export type AccessSession = { user: AuthUser; accessToken: string; tokenType: 'Bearer'; expiresIn: number; refreshToken: string };
