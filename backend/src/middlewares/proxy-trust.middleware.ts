/**
 * Le indica a Express si puede confiar en que otro servidor, llamado proxy, le está pasando correctamente la IP del usuario. 
 * Esto importa porque el backend 
 * puede estar detrás de Vercel u otro intermediario; si confía en cualquier encabezado, alguien podría inventar su IP.
 * 
 * 
 * FUNCIÓN: Configura confianza de proxy para Express según plataforma de despliegue.
 * RESPONSABILIDAD: Asegurar que IP/protocolo derivado de cabeceras forwarding solo se confíe desde proxy esperado.
 * CONEXIONES: Importa: No importa módulos relativos del proyecto. Se utiliza desde: backend/src/app.ts
 * FUNCIONAMIENTO: Aplica el número/política de saltos permitido para runtime Vercel o servidor local.
 * IMPORTANCIA: Evita falsificar IP/esquema de cliente por encabezados arbitrarios.
 */
import type { Application } from 'express';

/** Vercel replaces X-Forwarded-For with the client IP before invoking the app. */
/** Ajusta trust proxy para Vercel o la ejecución directa local. */
export function configureProxyTrust(app: Application, isVercelRuntime = process.env.VERCEL === '1'): void {
  app.set('trust proxy', isVercelRuntime ? 1 : false);
}
