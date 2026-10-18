import type { Application } from 'express';

/** Vercel replaces X-Forwarded-For with the client IP before invoking the app. */
export function configureProxyTrust(app: Application, isVercelRuntime = process.env.VERCEL === '1'): void {
  app.set('trust proxy', isVercelRuntime ? 1 : false);
}
