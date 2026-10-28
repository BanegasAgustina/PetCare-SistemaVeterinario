// Este archivo se encarga de lo siguiente: Tipos de TypeScript compartidos; describen la forma de los datos que maneja la app.

/** Contratos de autenticación. Ningún formulario puede elegir el rol del usuario. */
// Tipo AuthUser: define la forma o las opciones válidas de los datos usados por este módulo.
export type AuthUser = { id: string; firstName: string; lastName: string; email: string; phone: string | null; profilePhotoUrl?:string|null; role: string; permissions?: string[];
  veterinarian?: { id: string; licenseNumber: string; professionalDescription?:string|null; specialties: { id: string; name: string }[] } | null; roleName?: string;professional?:{typeId:string;name:string;isClinical:boolean;serviceIds:string[]}|null };
// Tipo LoginValues: define la forma o las opciones válidas de los datos usados por este módulo.
export type LoginValues = { email: string; password: string };
// Tipo RegisterValues: define la forma o las opciones válidas de los datos usados por este módulo.
export type RegisterValues = { firstName: string; lastName: string; email: string; phone: string; password: string; confirmPassword: string };
// Tipo AccessSession: define la forma o las opciones válidas de los datos usados por este módulo.
export type AccessSession = { user: AuthUser; accessToken: string; tokenType: 'Bearer'; expiresIn: number; refreshToken: string };
// Tipo StoredSession: define la forma o las opciones válidas de los datos usados por este módulo.
export type StoredSession = { accessToken: string; expiresAt: number; refreshToken?: string };
/** Desafío restringido a email: no autoriza acceso a ninguna función de la cuenta. */
// Tipo VerificationChallenge: define la forma o las opciones válidas de los datos usados por este módulo.
export type VerificationChallenge = { receivedAt?: number; verificationToken: string; maskedEmail: string; retryAfterSeconds: number; expiresAt: string | null; delivery: 'sent' | 'failed' | 'pending' };
// Tipo RegistrationFormValues: define la forma o las opciones válidas de los datos usados por este módulo.
export type RegistrationFormValues = Omit<RegisterValues, 'firstName' | 'lastName'> & { fullName: string };
// Tipo RegistrationResult: define la forma o las opciones válidas de los datos usados por este módulo.
export type RegistrationResult = { user: AuthUser; verification: VerificationChallenge };
