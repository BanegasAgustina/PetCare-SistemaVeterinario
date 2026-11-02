/**
 * ARCHIVO: notification-jobs.routes.ts
 * UBICACIÓN: backend/src/routes/notification-jobs.routes.ts
 * FUNCIÓN: Crea el endpoint de procesamiento de trabajos de notificación programados.
 * RESPONSABILIDAD: Validar credencial de cron y ejecutar lotes de trabajo sin exponerlos al público general.
 * CONEXIONES: Importa: backend/src/services/notifications.service.ts, backend/src/utils/app-error.ts, backend/src/utils/cron-auth.ts Se utiliza desde: backend/src/app.ts
 * FUNCIONAMIENTO: Recibe processor inyectable, valida autorización de cron y devuelve resultado o error acotado.
 * IMPORTANCIA: Permite que la plataforma programadora active trabajos de notificaciones.
 */
import { Router } from 'express';
import { processNotificationJobs } from '../services/notifications.service';
import { AppError } from '../utils/app-error';
import { isCronAuthorized } from '../utils/cron-auth';

// Tipo NotificationJobResult: define la forma o las opciones válidas de los datos usados por este módulo.
type NotificationJobResult = Awaited<ReturnType<typeof processNotificationJobs>>;
// Tipo NotificationJobProcessor: define la forma o las opciones válidas de los datos usados por este módulo.
type NotificationJobProcessor = () => Promise<NotificationJobResult>;

/** Crea un router inyectable para procesar lotes de notificaciones programados. */
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
