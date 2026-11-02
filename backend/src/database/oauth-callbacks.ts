/**
 * ARCHIVO: oauth-callbacks.ts
 * UBICACIÓN: backend/src/database/oauth-callbacks.ts
 * FUNCIÓN: Valida destinos permitidos para retornos OAuth.
 * RESPONSABILIDAD: Normaliza origen/provider y solo conserva URLs de callback compatibles con allowlist/configuración.
 * CONEXIONES: Importa: backend/src/config/oauth.ts Se utiliza desde: No se detectaron importadores estáticos; puede ser una entrada por convención o una herramienta invocada desde package.json.
 * FUNCIONAMIENTO: Configuración de OAuth y servicio de autenticación → resolver de callbacks.
 * IMPORTANCIA: Evita redirecciones abiertas luego del retorno del proveedor.
 */
/** Imprime únicamente URLs públicas calculadas para copiar a los proveedores; nunca secretos. */
import 'dotenv/config';
import { backendOrigin,providers } from '../config/oauth';
try {const origin=backendOrigin();for(const provider of providers)console.info(`${provider}: ${origin}/api/auth/oauth/${provider}/callback`);}catch{console.error('Configurá BACKEND_URL con el origen del backend, sin /api.');process.exitCode=1;}
