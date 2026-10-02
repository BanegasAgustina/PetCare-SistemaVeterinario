/** Agrupa las rutas públicas bajo /api para ampliar la API por módulos. */
import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { createDatabaseHealthHandler } from '../controllers/database-health.controller';
import { authRouter } from './auth.routes';
import { clientRouter } from './client.routes';
import { veterinarianAdminRouter, invitationRouter, specialtiesAdminRouter, veterinarianPanelRouter } from './veterinarian.routes';

export const apiRouter = Router();
apiRouter.get('/health', getHealth);
apiRouter.get('/health/database', createDatabaseHealthHandler());
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/veterinarians', veterinarianAdminRouter);
apiRouter.use('/admin/specialties', specialtiesAdminRouter);
apiRouter.use('/auth/veterinarian-invitations', invitationRouter);
apiRouter.use('/vet', veterinarianPanelRouter);
apiRouter.use('/client', clientRouter);
