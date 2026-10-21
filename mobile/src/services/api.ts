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
  PHOTO_STORAGE_UNAVAILABLE: 'El almacenamiento de fotos no está disponible o todavía no está configurado. Revisá la conexión e intentá nuevamente.',
  PHOTO_REFERENCE_UNSUPPORTED: 'Esta foto pertenece al almacenamiento anterior. Volvé a seleccionarla para guardarla.',
  SCHEMA_UPDATE_REQUIRED: 'No pudimos recuperar los datos de la clínica. Intentá nuevamente.',
  STORE_FULFILLMENT_SCHEMA_REQUIRED: 'Falta aplicar la migración 004 de entregas del ecommerce. El administrador debe actualizar el backend para habilitar retiro y envío.',
  STORE_ADDRESSES_SCHEMA_REQUIRED: 'Las direcciones guardadas requieren la migración 006. Podés ingresar la dirección manualmente y continuar.',
  ROUTE_NOT_FOUND: 'El backend conectado todavía no tiene esta ruta. Actualizá el servidor de PetCare para continuar.',
  INVALID_TRANSITION: 'El estado cambió o esa acción no está permitida. Actualizá la consulta.',
  RESERVATION_EXPIRED: 'La reserva venció y las unidades volvieron al stock.',
  PRESCRIPTION_REQUIRED: 'Seleccioná una receta vigente para este producto y mascota.',
  STOCK_CONFLICT: 'El stock reservado requiere revisión administrativa.',
  PAYMENT_NOT_INTEGRATED: 'El sistema de pagos todavía no está conectado. Esta operación es una demostración y no se realizará ningún cobro.',
  PAYLOAD_TOO_LARGE: 'La imagen supera el tamaño permitido. Elegí una foto más pequeña.',
  STOCK_UNAVAILABLE: 'No hay stock suficiente. Actualizá la tienda para revisar disponibilidad.',
  SLOT_UNAVAILABLE: 'El horario ya no está disponible. Elegí otro horario.',
  PET_HAS_APPOINTMENTS: 'La mascota tiene turnos pendientes y no puede desactivarse.',
  CART_EMPTY: 'Tu carrito está vacío.',
  CURRENT_PASSWORD_INVALID: 'La contraseña actual no es correcta.',
  PASSWORD_CHANGE_REQUIRED: 'Tenés que cambiar la contraseña inicial para continuar.',
  PASSWORD_CHANGE_NOT_REQUIRED: 'La cuenta ya tiene una contraseña propia. Iniciá sesión.',
  FORBIDDEN: 'No tenés permiso para esta acción.',
  DB_CONFLICT: 'El email, la matrícula o el nombre ya están registrados.',
  INVALID_PERMISSION: 'No se pueden asignar permisos desconocidos o administrativos.',
  NOT_FOUND: 'No encontramos el registro solicitado.',
  ACCOUNT_INACTIVE: 'Activá la cuenta antes de enviar una invitación.',
  INVALID_INVITATION: 'La invitación no es válida o venció. Solicitá una nueva al administrador.',
  INVITATION_UNAVAILABLE: 'La activación por correo todavía no está configurada.',
  INVITATION_COOLDOWN: 'Esperá un minuto antes de reenviar la invitación.',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese email.',
  INVALID_CREDENTIALS: 'Correo electrónico o contraseña incorrectos.',
  VALIDATION_ERROR: 'Revisá los datos ingresados.',
  AUTH_REQUIRED: 'Iniciá sesión para continuar.',
  TOKEN_EXPIRED: 'Tu sesión venció. Iniciá sesión nuevamente.',
  INVALID_TOKEN: 'La sesión no es válida. Iniciá sesión nuevamente.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.',
  AUTH_UNAVAILABLE: 'El inicio de sesión no está disponible. Intentá más tarde.',
  DB_UNAVAILABLE: 'PetCare no está disponible en este momento. Intentá más tarde.',
  EMAIL_NOT_VERIFIED: 'Tu correo todavía no está verificado.',
  EMAIL_UNAVAILABLE: 'El envío de correo no está disponible. Intentá más tarde.',
  PASSWORD_RESET_UNAVAILABLE: 'La recuperación de contraseña no está configurada en el servidor.',
  PASSWORD_RESET_INVALID: 'El enlace no es válido, venció o ya se utilizó. Solicitá uno nuevo.',
  EMAIL_DELIVERY_FAILED: 'No pudimos enviar el correo. Revisá el servicio de email e intentá más tarde.',
  EMAIL_ALREADY_VERIFIED: 'Tu correo ya está verificado. Podés iniciar sesión.',
  VERIFICATION_SESSION_EXPIRED: 'Volvé a iniciar sesión para retomar la verificación.',
  VERIFICATION_CODE_INVALID: 'El código ingresado no es correcto.',
  VERIFICATION_CODE_EXPIRED: 'El código venció. Solicitá uno nuevo.',
  VERIFICATION_ATTEMPTS_EXCEEDED: 'Alcanzaste el límite de intentos. Solicitá un código nuevo.',
  VERIFICATION_COOLDOWN: 'Esperá unos segundos antes de reenviar.',
  VERIFICATION_SEND_LIMIT: 'Alcanzaste el límite de envíos. Intentá más tarde.',
};

export const PRODUCTION_API_URL = 'https://pet-care-sistema-veterinario.vercel.app/api';

/** Registra solo código y estado; nunca URL, encabezados, tokens ni cuerpo de la respuesta. */
function safeEndpoint(path: string): string {
  const pathname = path.split('?')[0].replace(/^\/api(?=\/|$)/i, '');
  return pathname.replace(/\/(products|pets|orders|addresses|notifications|cart)\/[^/]+/g, '/$1/:id').slice(0, 140) || '/';
}

function reportApiFailure(code: string, status: number, method: string, endpoint: string): void {
  if (__DEV__) console.warn('[PetCare API]', JSON.stringify({ method, endpoint: safeEndpoint(endpoint), code, status }));
}

export function getApiUrl(): string {
  const configuredValue = process.env.EXPO_PUBLIC_API_URL?.trim();
  // En builds de producción / release (APK compilado o web pública), si no se inyectó la variable,
  // se utiliza la URL oficial HTTPS de producción para garantizar funcionamiento autónomo.
  // En desarrollo (__DEV__), si no se define, se exige configuración explícita.
  const value = configuredValue || (!__DEV__ ? PRODUCTION_API_URL : '');
  try {
    if (!value) throw new Error();
    const url = new URL(value);
    const isLocalHost = ['localhost', '127.0.0.1'].includes(url.hostname) || /^(192\.168\.|10\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    // En producción/release se rechaza terminantemente HTTP, localhost e IPs privadas locales.
    if (!__DEV__ && (url.protocol !== 'https:' || isLocalHost)) {
      throw new Error();
    }
    if (url.protocol !== 'https:' && !__DEV__) throw new Error();
    if (url.username || url.password) throw new Error();
    const path = url.pathname.replace(/\/+$/, '');
    if (!/\/api$/i.test(path)) url.pathname = `${path}/api`;
    return url.toString().replace(/\/+$/, '');
  } catch { throw new ApiError('API_NOT_CONFIGURED', 'La conexión con PetCare todavía no está configurada.'); }
}

export async function apiRequest<T>(path: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; accessToken?: string } = {}): Promise<T> {
  // Asegura formato de ruta sin duplicar /api (ej. evita /api/api/...)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanPath = normalizedPath.replace(/^\/api(?=\/|$)/i, '');
  const url = `${getApiUrl()}${cleanPath}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    let response: Response;
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET', signal: controller.signal,
        headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}) },
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch {
      reportApiFailure('NETWORK_ERROR', 0, options.method ?? 'GET', path);
      throw new ApiError('NETWORK_ERROR', 'No pudimos conectar con PetCare. Revisá tu conexión e intentá nuevamente.');
    }
    let result: any;
    try { result = await response.json(); }
    catch {
      const code = response.ok ? 'INVALID_RESPONSE' : 'HTTP_ERROR';
      reportApiFailure(code, response.status, options.method ?? 'GET', path);
      throw new ApiError(code, response.ok ? 'PetCare devolvió una respuesta que no pudimos interpretar.' : 'El servidor respondió con un error.', response.status);
    }
    if (!response.ok || result?.success !== true) {
      const code = typeof result?.error?.code === 'string' ? result.error.code : 'SERVER_ERROR';
      reportApiFailure(code, response.status, options.method ?? 'GET', path);
      const isStoreConfigurationRead = (options.method ?? 'GET') === 'GET' && /^\/client\/(?:cart|store\/(?:promotions|fulfillment|delivery-quote|addresses(?:\/|$)))$/.test(cleanPath.split('?')[0]);
      const message = code === 'NOT_FOUND' && isStoreConfigurationRead
        ? messages.ROUTE_NOT_FOUND
        : messages[code] ?? 'No pudimos completar la operación. Intentá nuevamente.';
      throw new ApiError(code, message, response.status, result?.error?.verification);
    }
    return result.data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    reportApiFailure('CLIENT_ERROR', 0, options.method ?? 'GET', path);
    throw new ApiError('CLIENT_ERROR', 'No pudimos completar la operación. Intentá nuevamente.');
  } finally { clearTimeout(timeout); }
}

export function friendlyError(error: unknown): string {
  return error instanceof ApiError ? error.message : 'No pudimos completar la operación. Intentá nuevamente.';
}
