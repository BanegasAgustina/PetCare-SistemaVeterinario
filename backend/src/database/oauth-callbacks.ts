/** Imprime únicamente URLs públicas calculadas para copiar a los proveedores; nunca secretos. */
import 'dotenv/config';
import { backendOrigin,providers } from '../config/oauth';
try {const origin=backendOrigin();for(const provider of providers)console.info(`${provider}: ${origin}/api/auth/oauth/${provider}/callback`);}catch{console.error('Configurá BACKEND_URL con el origen del backend, sin /api.');process.exitCode=1;}
