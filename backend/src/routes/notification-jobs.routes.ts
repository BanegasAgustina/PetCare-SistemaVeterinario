// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

import { Router } from 'express';
import { processNotificationJobs } from '../services/notifications.service';
import { AppError } from '../utils/app-error';
import { isCronAuthorized } from '../utils/cron-auth';

// Tipo NotificationJobResult: define la forma o las opciones válidas de los datos usados por este módulo.
type NotificationJobResult = Awaited<ReturnType<typeof processNotificationJobs>>;
// Tipo NotificationJobProcessor: define la forma o las opciones válidas de los datos usados por este módulo.
type NotificationJobProcessor = () => Promise<NotificationJobResult>;

// Función createNotificationJobsRouter: crea un registro o inicia una operación dentro de este módulo.
export function createNotificationJobsRouter(processJobs: NotificationJobProcessor = processNotificationJobs): Router {
  const router = Router();
  router.get('/', async (request, response, next) => {
    const secret = process.env.CRON_SECRET?.trim() ?? '';
    const authorization = request.get('authorization') ?? '';
    if (Buffer.byteLength(secret, 'utf8') < 32) {
      next(new AppError('NOTIFICATION_JOB_UNAVAILABLE', 503, 'El procesamiento de notificaciones no está configurado.'));
      return;
    }
    if (!isCronAuthorized(authorization, secret)) {
      next(new AppError('AUTH_REQUIRED', 401, 'No autorizado.'));
      return;
    }

    try {
      const result = await processJobs();
      response.setHeader('Cache-Control', 'no-store');
      response.status(200).json({ success: true, data: result });
    } catch (error) {
      console.error(JSON.stringify({ event: 'notification_cron_failed' }));
      next(error);
    }
  });
  return router;
}

// Dato notificationJobsRouter: conserva un valor calculado o de configuración usado por este módulo.
export const notificationJobsRouter = createNotificationJobsRouter();
