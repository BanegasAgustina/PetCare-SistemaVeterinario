/**
 * ARCHIVO: notification.routes.ts
 * UBICACIÓN: backend/src/routes/notification.routes.ts
 * FUNCIÓN: Declara rutas de notificaciones asociadas a una sesión.
 * RESPONSABILIDAD: Proteger consulta, lectura y ocultamiento de notificaciones y conservar ruta cliente heredada.
 * CONEXIONES: Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/controllers/client.controller.ts Se utiliza desde: backend/src/routes/client.routes.ts, backend/src/routes/index.ts
 * FUNCIONAMIENTO: Aplica authenticate y el controller de cliente a endpoints remotos de notificaciones.
 * IMPORTANCIA: Conecta la bandeja frontend con notificaciones persistidas para el usuario autenticado.
 */
/** Shared authenticated notification routes. The existing client paths remain aliases. */
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireNotificationAccess } from '../middlewares/permission.middleware';
import { clientHandler } from '../controllers/client.controller';

/** Registra en el router las rutas de consulta y actualización de notificaciones para clientes. */
function registerOperations(router:Router) {
  // router.post('/'): Lista notificaciones del usuario
  router.post('/',clientHandler('notifications'));
  // router.patch('/read-all'): Marca todas las notificaciones como leídas
  router.patch('/read-all',clientHandler('notification-read-all'));
  // router.patch('/:id/read'): Marca una notificación como leída
  router.patch('/:id/read',clientHandler('notification-read'));
  // router.delete('/:id'): Oculta una notificación
  router.delete('/:id',clientHandler('notification-hide'));
}

export const notificationRouter=Router();
// notificationRouter.use: Evita que se almacenen en caché las respuestas de este router.
notificationRouter.use(authenticate,requireNotificationAccess,(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
// Registra en este router los cuatro endpoints compartidos de consulta, lectura y ocultamiento.
registerOperations(notificationRouter);

/** Mounted inside clientRouter so its personal-access guard sees /notifications before the prefix is trimmed. */
export const legacyClientNotificationRouter=Router();
// legacyClientNotificationRouter.use: Evita que se almacenen en caché las respuestas de este router.
legacyClientNotificationRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
// Registra en este router los cuatro endpoints compartidos de consulta, lectura y ocultamiento.
registerOperations(legacyClientNotificationRouter);
