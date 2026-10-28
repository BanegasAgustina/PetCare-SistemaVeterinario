// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Agrupa las rutas públicas bajo /api para ampliar la API por módulos. */
import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { createDatabaseHealthHandler } from '../controllers/database-health.controller';
import { authRouter } from './auth.routes';
import { clientRouter } from './client.routes';
import { adminRouter } from './admin.routes';
import { clinicRouter } from './clinic.routes';
import { veterinarianAdminRouter, invitationRouter, specialtiesAdminRouter, veterinarianPanelRouter } from './veterinarian.routes';
import { publicSettingsRouter } from './settings.routes';

// Dato apiRouter: conserva un valor calculado o de configuración usado por este módulo.
export const apiRouter = Router();
apiRouter.get('/health', getHealth);
apiRouter.get('/health/database', createDatabaseHealthHandler());
apiRouter.use('/settings', publicSettingsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/veterinarians', veterinarianAdminRouter);
apiRouter.use('/admin/specialties', specialtiesAdminRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/auth/veterinarian-invitations', invitationRouter);
apiRouter.use('/auth/invitations', invitationRouter);
apiRouter.use('/vet', veterinarianPanelRouter);
apiRouter.use('/client', clientRouter);
apiRouter.use('/clinic', clinicRouter);
