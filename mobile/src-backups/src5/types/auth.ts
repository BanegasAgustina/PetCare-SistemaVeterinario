/** Contratos de autenticación. Ningún formulario puede elegir el rol del usuario. */
export type AuthUser = { id: string; firstName: string; lastName: string; email: string; phone: string | null; role: 'CLIENT' | 'VETERINARIAN' | 'GROOMER' | 'SECRETARY' | 'ADMIN' | 'SUPER_ADMIN'; permissions?: string[];
  veterinarian?: { id: string; licenseNumber: string; specialties: { id: string; name: string }[] } | null; roleName?: string;professional?:{typeId:string;name:string;isClinical:boolean;serviceIds:string[]}|null };
export type LoginValues = { email: string; password: string };
export type RegisterValues = { firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string };
export type AccessSession = { user: AuthUser; accessToken: string; tokenType: 'Bearer'; expiresIn: number; refreshToken: string };
export type StoredSession = { accessToken: string; expiresAt: number; refreshToken?: string };
/** Desafío restringido a email: no autoriza acceso a ninguna función de la cuenta. */
export type VerificationChallenge = { receivedAt?: number; verificationToken: string; maskedEmail: string; retryAfterSeconds: number; expiresAt: string | null; delivery: 'sent' | 'failed' | 'pending' };
export type RegistrationFormValues = Omit<RegisterValues, 'firstName' | 'lastName'> & { fullName: string };
export type RegistrationResult = { user: AuthUser; verification: VerificationChallenge };
