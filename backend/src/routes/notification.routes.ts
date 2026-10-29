/** Shared authenticated notification routes. The existing client paths remain aliases. */
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireNotificationAccess } from '../middlewares/permission.middleware';
import { clientHandler } from '../controllers/client.controller';

function registerOperations(router:Router) {
  router.post('/',clientHandler('notifications'));
  router.patch('/read-all',clientHandler('notification-read-all'));
  router.patch('/:id/read',clientHandler('notification-read'));
  router.delete('/:id',clientHandler('notification-hide'));
}

export const notificationRouter=Router();
notificationRouter.use(authenticate,requireNotificationAccess,(_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
registerOperations(notificationRouter);

/** Mounted inside clientRouter so its personal-access guard sees /notifications before the prefix is trimmed. */
export const legacyClientNotificationRouter=Router();
legacyClientNotificationRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
registerOperations(legacyClientNotificationRouter);
