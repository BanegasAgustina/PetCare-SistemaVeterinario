/** Cliente HTTP con timeout y errores públicos: nunca imprime credenciales ni tokens. */
export class ApiError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 0, public readonly verification?: unknown, public readonly fieldErrors: readonly ApiFieldError[] = []) { super(message); this.name = 'ApiError'; }
}
export type ApiFieldError={field:string;message:string};
const messages: Record<string, string> = {
  OAUTH_UNAVAILABLE:'Este proveedor todavía no está configurado.',
  OAUTH_INVALID_STATE:'La solicitud OAuth venció o ya fue usada. Iniciá el proceso nuevamente.',
  OAUTH_INVALID_PROOF:'La solicitud OAuth venció o no pertenece a este dispositivo.',
  OAUTH_PROVIDER_ERROR:'El proveedor no pudo verificar tu identidad. Volvé a intentar.',
  OAUTH_ACCOUNT_CONFLICT:'Esta identidad ya está vinculada a otra cuenta.',
  OAUTH_LINK_REQUIRED:'Ese email ya tiene una cuenta. Iniciá sesión con contraseña y vinculá el proveedor desde tu perfil.',
  VET_PROFILE_REQUIRED: 'Gestioná ese usuario desde Veterinarios para conservar su matrícula y especialidades.',
  PHOTO_STORAGE_UNAVAILABLE: 'No pudimos guardar la foto. Intentá nuevamente más tarde.',
  PHOTO_REFERENCE_UNSUPPORTED: 'No pudimos usar esta foto. Volvé a seleccionarla e intentá nuevamente.',
  SCHEMA_UPDATE_REQUIRED: 'No pudimos recuperar los datos de la clínica. Intentá nuevamente.',
  STORE_FULFILLMENT_SCHEMA_REQUIRED: 'Las opciones de retiro y envío no están disponibles en este momento. Intentá nuevamente más tarde.',
  STORE_ADDRESSES_SCHEMA_REQUIRED: 'No pudimos cargar tus direcciones guardadas. Podés ingresarla manualmente para continuar.',
  ROUTE_NOT_FOUND: 'Esta función no está disponible en este momento. Intentá nuevamente más tarde.',
  INVALID_TRANSITION: 'El estado cambió y ya no se puede realizar esa acción. Actualizá la información e intentá nuevamente.',
  RESERVATION_EXPIRED: 'La reserva venció y las unidades volvieron al stock.',
  PRESCRIPTION_REQUIRED: 'Seleccioná una receta vigente para este producto y mascota.',
  STOCK_CONFLICT: 'No pudimos reservar esas unidades. Actualizá el carrito e intentá nuevamente.',
  PAYMENT_NOT_INTEGRATED: 'Los pagos con tarjeta no están disponibles todavía. No se realizó ningún cobro.',
  STORE_DEMO_DISABLED: 'Los pagos con tarjeta no están disponibles en este momento. Elegí otra forma de pago.',
  PAYMENT_INTENT_UNAVAILABLE: 'El plazo sigue activo o el comprobante ya está en revisión. Actualizá el pedido e intentá nuevamente.',
  PAYMENT_PROOF_INVALID: 'El comprobante debe ser un PDF, JPG, PNG o WebP válido de hasta 5 MB.',
  PAYMENT_PROOF_STORAGE_UNAVAILABLE: 'No pudimos guardar el comprobante de forma segura. Intentá nuevamente.',
  PAYMENT_PROOF_REQUIRED: 'El administrador debe consultar un comprobante enviado antes de verificar el pago.',
  PAYMENT_ALREADY_CONFIRMED: 'La transferencia ya fue confirmada.',
  PAYMENT_REVIEW_REQUIRED: 'Las transferencias reales requieren comprobante y revisión del administrador principal.',
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
  RECORD_IN_USE: 'El registro tiene servicios o profesionales asociados. Desactivalo para conservar esas relaciones.',
  ACCOUNT_INACTIVE: 'Activá la cuenta antes de enviar una invitación.',
  INVALID_INVITATION: 'La invitación no es válida o venció. Solicitá una nueva al administrador.',
  INVITATION_UNAVAILABLE: 'No se pueden enviar invitaciones en este momento. Intentá nuevamente más tarde.',
  INVITATION_COOLDOWN: 'Esperá un minuto antes de reenviar la invitación.',
  EMAIL_ALREADY_EXISTS: 'Ya existe una cuenta con ese email.',
  INVALID_CREDENTIALS: 'Correo electrónico o contraseña incorrectos.',
  VALIDATION_ERROR: 'Revisá los campos marcados e intentá nuevamente.',
  AUTH_REQUIRED: 'Iniciá sesión para continuar.',
  TOKEN_EXPIRED: 'Tu sesión venció. Iniciá sesión nuevamente.',
  INVALID_TOKEN: 'La sesión no es válida. Iniciá sesión nuevamente.',
  TOO_MANY_ATTEMPTS: 'Demasiados intentos. Esperá unos minutos y volvé a intentar.',
  AUTH_UNAVAILABLE: 'El inicio de sesión no está disponible. Intentá más tarde.',
  DB_UNAVAILABLE: 'PetCare no está disponible en este momento. Intentá más tarde.',
  EMAIL_NOT_VERIFIED: 'Tu correo todavía no está verificado.',
  EMAIL_UNAVAILABLE: 'El envío de correo no está disponible. Intentá más tarde.',
  PASSWORD_RESET_UNAVAILABLE: 'No se puede recuperar la contraseña en este momento. Intentá nuevamente más tarde.',
  PASSWORD_RESET_INVALID: 'El enlace no es válido, venció o ya se utilizó. Solicitá uno nuevo.',
  EMAIL_DELIVERY_FAILED: 'No pudimos enviar el correo. Intentá nuevamente más tarde.',
  EMAIL_ALREADY_VERIFIED: 'Tu correo ya está verificado. Podés iniciar sesión.',
  VERIFICATION_SESSION_EXPIRED: 'Volvé a iniciar sesión para retomar la verificación.',
  VERIFICATION_CODE_INVALID: 'El código ingresado no es correcto.',
  VERIFICATION_CODE_EXPIRED: 'El código venció. Solicitá uno nuevo.',
  VERIFICATION_ATTEMPTS_EXCEEDED: 'Alcanzaste el límite de intentos. Solicitá un código nuevo.',
  VERIFICATION_COOLDOWN: 'Esperá unos segundos antes de reenviar.',
  VERIFICATION_SEND_LIMIT: 'Alcanzaste el límite de envíos. Intentá más tarde.',
};

const internalMessagePattern = /\b(?:mysql|mariadb|layerbase|backend|server|endpoint|route|sql|sqlstate|http|servidor|base de datos|database|tabla|columnas?|schema|migraci[oó]n|persistencia|persistido|stack trace|exception)\b|\b(?:ER_[A-Z_]+|ECONN[A-Z_]+|ENOTFOUND)\b|\b(?:error|c[oó]digo)\s*[45]\d{2}\b/i;
function publicMessage(message: string): string | null {
  const clean = message.trim();
  return clean && !internalMessagePattern.test(clean) ? clean.slice(0, 500) : null;
}

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
  } catch { throw new ApiError('API_NOT_CONFIGURED', 'PetCare no está disponible en este momento. Intentá más tarde.'); }
}

export async function apiRequest<T>(path: string, options: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; body?: unknown; contentType?: string; headers?:Record<string,string>;accessToken?: string } = {}): Promise<T> {
  // Asegura formato de ruta sin duplicar /api (ej. evita /api/api/...)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const cleanPath = normalizedPath.replace(/^\/api(?=\/|$)/i, '');
  const url = `${getApiUrl()}${cleanPath}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    let response: Response;const rawBody=options.body instanceof Blob||options.body instanceof ArrayBuffer||ArrayBuffer.isView(options.body);
    try {
      response = await fetch(url, {
        method: options.method ?? 'GET', signal: controller.signal,
        headers: { Accept: 'application/json', ...(options.body === undefined ? {} : { 'Content-Type': options.contentType??(rawBody?'application/octet-stream':'application/json') }), ...(options.headers??{}), ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}) },
        body: options.body === undefined ? undefined : rawBody?options.body as BodyInit:JSON.stringify(options.body),
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
      throw new ApiError(code, 'No pudimos completar la operación. Intentá nuevamente.', response.status);
    }
    if (!response.ok || result?.success !== true) {
      const code = typeof result?.error?.code === 'string' ? result.error.code : 'SERVER_ERROR';
      reportApiFailure(code, response.status, options.method ?? 'GET', path);
      const isStoreConfigurationRead = (options.method ?? 'GET') === 'POST' && /^\/client\/(?:cart|store\/(?:categories|fulfillment|promotions|banners|delivery-quote|addresses\/query|products(?:\/.*)?))$/.test(cleanPath.split('?')[0]);
      const serverMessage=typeof result?.error?.message==='string'?publicMessage(result.error.message):null;
      const message = code === 'NOT_FOUND' && isStoreConfigurationRead
        ? messages.ROUTE_NOT_FOUND
        : code==='VALIDATION_ERROR'&&serverMessage?serverMessage:(messages[code] ?? serverMessage) || 'No pudimos completar la operación. Intentá nuevamente.';
      const fieldErrors:ApiFieldError[]=Array.isArray(result?.error?.errors)?result.error.errors.flatMap((item:unknown)=>{
        if(!item||typeof item!=='object')return[];const candidate=item as Record<string,unknown>;
        if(typeof candidate.field!=='string'||typeof candidate.message!=='string')return[];
        return [{field:candidate.field.slice(0,120),message:publicMessage(candidate.message)?.slice(0,300)??'Revisá este campo.'}];
      }):[];
      throw new ApiError(code, message, response.status, result?.error?.verification,fieldErrors);
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
