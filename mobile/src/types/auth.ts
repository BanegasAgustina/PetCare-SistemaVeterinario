/**
 * ARCHIVO: auth.ts
 * UBICACIÓN: mobile/src/types/auth.ts
 * FUNCIÓN: Tipos y contratos TypeScript.
 * RESPONSABILIDAD: Tipos y contratos TypeScript dentro de PetCare; agrupa las declaraciones de auth.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: mobile/src/app/login.tsx, mobile/src/app/register.tsx, mobile/src/components/forms/OAuthRegistrationModal.tsx, mobile/src/components/layout/EntryRedirect.tsx, mobile/src/components/profile/AccountProfileScreen.tsx, mobile/src/components/ui/VerificationCodeModal.tsx, mobile/src/contexts/AuthContext.tsx, mobile/src/services/auth.service.ts y 10 más
 * FUNCIONAMIENTO: Declara formas de datos utilizadas por TypeScript; no transforma información durante la ejecución.
 * IMPORTANCIA: Ubica el papel del módulo dentro del flujo de PetCare; las reglas específicas se describen en las funciones de este archivo y en la guía por archivos.
 */
/** Contratos de autenticación. Ningún formulario puede elegir el rol del usuario. */
/** Perfil público devuelto por la API, con permisos efectivos y perfiles profesionales opcionales. */
export type AuthUser = { id: string; firstName: string; lastName: string; email: string; phone: string | null; profilePhotoUrl?:string|null; role: string; permissions?: string[];
  veterinarian?: { id: string; licenseNumber: string; professionalDescription?:string|null; specialties: { id: string; name: string }[] } | null; roleName?: string;professional?:{typeId:string;name:string;isClinical:boolean;serviceIds:string[]}|null };
/** Campos que el formulario de acceso envía al servicio; no incluye rol. */
export type LoginValues = { email: string; password: string };
/** Datos de registro normalizados por el cliente; confirmPassword solo se usa en UI y el servicio lo omite. */
export type RegisterValues = { firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string };
/** Respuesta de sesión del backend antes de ser convertida a forma persistible. */
export type AccessSession = { user: AuthUser; accessToken: string; tokenType: 'Bearer'; expiresIn: number; refreshToken: string };
/** Campos mínimos que las implementaciones nativa/web guardan durante la sesión. */
export type StoredSession = { accessToken: string; expiresAt: number; refreshToken?: string };
/** Desafío restringido a email: no autoriza acceso a ninguna función de la cuenta. */
/** Estado limitado para completar verificación de email; por sí solo no representa una sesión autenticada. */
export type VerificationChallenge = { receivedAt?: number; verificationToken: string; maskedEmail: string; retryAfterSeconds: number; expiresAt: string | null; delivery: 'sent' | 'failed' | 'pending' };
/** Variante visual que captura el nombre completo y luego se transforma al contrato RegisterValues. */
export type RegistrationFormValues = Omit<RegisterValues, 'firstName' | 'lastName'> & { fullName: string };
/** Resultado del alta: perfil y desafío de verificación, sin access token. */
export type RegistrationResult = { user: AuthUser; verification: VerificationChallenge };
