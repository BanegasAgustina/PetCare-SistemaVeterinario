/** Cliente HTTP con timeout y errores públicos: nunca imprime credenciales ni tokens. */
export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 0, public readonly verification?: unknown) { super(message); this.name = 'ApiError'; }
}
const messages: Record<string, string> = {
  OAUTH_UNAVAILABLE:'Este proveedor todavía no está configurado.',
  OAUTH_INVALID_STATE:'La solicitud OAuth venció o ya fue usada. Iniciá el proceso nuevamente.',
  OAUTH_INVALID_PROOF:'La solicitud OAuth venció o no pertenece a este dispositivo.',
  OAUTH_PROVIDER_ERROR:'El proveedor no pudo verificar tu identidad. Volvé a intentar.',
  OAUTH_ACCOUNT_CONFLICT:'Esta identidad ya está vinculada a otra cuenta.',
  OAUTH_LINK_REQUIRED:'Ese email ya tiene una cuenta. Iniciá sesión con contraseña y vinculá el proveedor desde tu perfil.',
  VET_PROFILE_REQUIRED: 'Gestioná ese usuario desde Veterinarios para conservar su matrícula y especialidades.',
  PHOTO_STORAGE_UNAVAILABLE: 'El almacenamiento de fotos todavía no está configurado. Podés guardar la mascota sin foto.',
  PHOTO_REFERENCE_UNSUPPORTED: 'Esta foto pertenece al almacenamiento anterior. Debe volver a subirse al bucket privado.',
  SCHEMA_UPDATE_REQUIRED: 'Este módulo requiere actualizar el esquema de la clínica. No se pudo consultar sus datos.',
  INVALID_TRANSITION: 'El estado cambió o esa acción no está permitida. Actualizá la consulta.',
  PRESCRIPTION_REQUIRED: 'Seleccioná una receta vigente para este producto y mascota.',
  STOCK_CONFLICT: 'El stock reservado requiere revisión administrativa.',
  RESERVATION_ONLY: 'PetCare funciona mediante reservas para retiro. No procesa compras.',
  PAYLOAD_TOO_LARGE: 'La imagen supera el tamaño permitido. Elegí una foto más pequeña.',
  STOCK_UNAVAILABLE: 'No hay stock suficiente. Actualizá el carrito para revisar disponibilidad.',
  SLOT_UNAVAILABLE: 'El horario ya no está disponible. Elegí otro horario.',
  PET_HAS_APPOINTMENTS: 'La mascota tiene turnos pendientes y no puede desactivarse.',
  CART_EMPTY: 'Tu carrito está vacío.',
  CURRENT_PASSWORD_INVALID: 'La contraseña actual no es correcta.',
  FORBIDDEN: 'No tenés permiso para esta acción.',
  DB_CONFLICT: 'El email, la matrícula o el nombre ya están registrados.',
  INVALID_PERMISSION: 'No se pueden asignar permisos desconocidos o administrativos.',
  NOT_FOUND: 'No encontramos el registro solicitado.',
  ACCOUNT_INACTIVE: 'Activá la cuenta antes de enviar una invitación.',
  INVALID_INVITATION: 'La invitación no es válida o venció. Solicitá una nueva al administrador.',
  INVITATION_UNAVAILABLE: 'La activación por correo todavía no está configurada.',
  INVITATION_COOLDOWN: 'Esperá un minuto antes de reenviar la invitación.',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese email.',
  INVALID_CREDENTIALS: 'Email o contraseña incorrectos.',
  VALIDATION_ERROR: 'Revisá los datos ingresados.',
  AUTH_REQUIRED: 'Iniciá sesión para continuar.',
  TOKEN_EXPIRED: 'Tu sesión venció. Iniciá sesión nuevamente.',
  INVALID_TOKEN: 'La sesión no es válida. Iniciá sesión nuevamente.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.',
  AUTH_UNAVAILABLE: 'El inicio de sesión no está disponible. Intentá más tarde.',
  DB_UNAVAILABLE: 'PetCare no está disponible en este momento. Intentá más tarde.',
  EMAIL_NOT_VERIFIED: 'Tu correo todavía no está verificado.',
  EMAIL_UNAVAILABLE: 'El envío de correo no está disponible. Intentá más tarde.',
  EMAIL_DELIVERY_FAILED: 'No pudimos enviar el código. Intentá reenviarlo.',
  EMAIL_ALREADY_VERIFIED: 'Tu correo ya está verificado. Podés iniciar sesión.',
  VERIFICATION_SESSION_EXPIRED: 'Volvé a iniciar sesión para retomar la verificación.',
  VERIFICATION_CODE_INVALID: 'El código ingresado no es correcto.',
  VERIFICATION_CODE_EXPIRED: 'El código venció. Solicitá uno nuevo.',
  VERIFICATION_ATTEMPTS_EXCEEDED: 'Alcanzaste el límite de intentos. Solicitá un código nuevo.',
  VERIFICATION_COOLDOWN: 'Esperá unos segundos antes de reenviar.',
  VERIFICATION_SEND_LIMIT: 'Alcanzaste el límite de envíos. Intentá más tarde.',
};

function getApiUrl(): string {
  const value = process.env.EXPO_PUBLIC_API_URL?.trim();
  try {
    if (!value) throw new Error();
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    return value.replace(/\/+$/, '');
  } catch { throw new ApiError('API_NOT_CONFIGURED', 'La conexión con PetCare todavía no está configurada.'); }
}

export async function apiRequest<T>(path: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH'; body?: unknown; accessToken?: string } = {}): Promise<T> {
  const url = `${getApiUrl()}${path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(url, {
      method: options.method ?? 'GET', signal: controller.signal,
      headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}) },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
    const result = await response.json();
    if (!response.ok || result?.success !== true) {
      const code = typeof result?.error?.code === 'string' ? result.error.code : 'SERVER_ERROR';
      throw new ApiError(code, messages[code] ?? 'No pudimos completar la operación. Intentá nuevamente.', response.status, result?.error?.verification);
    }
    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError('NETWORK_ERROR', 'No pudimos conectar con PetCare. Revisá tu conexión e intentá nuevamente.');
  } finally { clearTimeout(timeout); }
}

export function friendlyError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No pudimos completar la operación. Intentá nuevamente.';
}
