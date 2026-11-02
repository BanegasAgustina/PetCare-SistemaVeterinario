/**
 * ARCHIVO: index.ts
 * UBICACIÓN: backend/src/routes/index.ts
 * PROPÓSITO: Reunir los routers de cada dominio bajo un router principal de API.
 * RESPONSABILIDAD: Mantener el mapa público de endpoints agrupado por dominio.
 * RELACIONES: app.ts monta apiRouter bajo /api. Cada router importado conecta sus endpoints con controladores y middlewares del dominio correspondiente.
 * FLUJO: Express recibe una solicitud bajo /api, este router la deriva según el prefijo; /health y /health/database se conectan directamente a sus controladores.
 * IMPORTANCIA: Permite localizar y extender la superficie HTTP central del backend.
 */

/** Agrupa las rutas públicas bajo /api para ampliar la API por módulos. */
import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';
import { createDatabaseHealthHandler } from '../controllers/database-health.controller';
import { authRouter } from './auth.routes';
import { clientRouter } from './client.routes';
import { adminRouter } from './admin.routes';
import { clinicRouter } from './clinic.routes';
import { veterinarianAdminRouter, invitationRouter, specialtiesAdminRouter, veterinarianPanelRouter, professionalPhotoRouter } from './veterinarian.routes';
import { publicSettingsRouter } from './settings.routes';
import { notificationRouter } from './notification.routes';
import { mediaRouter } from './media.routes';

// Dato apiRouter: conserva un valor calculado o de configuración usado por este módulo.
export const apiRouter = Router();
apiRouter.get('/health', getHealth);
apiRouter.get('/health/database', createDatabaseHealthHandler());
apiRouter.use('/settings', publicSettingsRouter);
apiRouter.use('/media',mediaRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/admin/veterinarians', veterinarianAdminRouter);
apiRouter.use('/admin/specialties', specialtiesAdminRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/auth/veterinarian-invitations', invitationRouter);
apiRouter.use('/auth/invitations', invitationRouter);
apiRouter.use('/vet/profile/photo', professionalPhotoRouter);
apiRouter.use('/vet', veterinarianPanelRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/client', clientRouter);
apiRouter.use('/clinic', clinicRouter);
