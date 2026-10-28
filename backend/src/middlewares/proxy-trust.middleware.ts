// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

import type { Application } from 'express';

/** Vercel replaces X-Forwarded-For with the client IP before invoking the app. */
// Función configureProxyTrust: concentra la lógica dentro de este módulo.
export function configureProxyTrust(app: Application, isVercelRuntime = process.env.VERCEL === '1'): void {
  app.set('trust proxy', isVercelRuntime ? 1 : false);
}
