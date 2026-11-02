/**
 * ARCHIVO: media.routes.ts
 * UBICACIÓN: backend/src/routes/media.routes.ts
 * FUNCIÓN: Declara endpoints para obtener parámetros de carga directa de imágenes.
 * RESPONSABILIDAD: Autenticar y limitar solicitudes antes de generar credenciales temporales de carga.
 * CONEXIONES: Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/types/auth.ts, backend/src/services/direct-image-upload.service.ts Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Usa middleware de sesión/rate limit y delega firma temporal al servicio de carga directa.
 * IMPORTANCIA: Separa carga de archivos del CRUD ordinario y evita exponer claves permanentes.
 */
import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import type { AuthUser } from '../types/auth';
import { signDirectImageUpload,verifyDirectImageUpload } from '../services/direct-image-upload.service';

export const mediaRouter=Router();
// mediaRouter.use: Aplica los controles compartidos a las rutas siguientes. Controles: límite de solicitudes.
mediaRouter.use(authenticate,createAuthRateLimiter(30));
// mediaRouter.post('/uploads/sign'): Genera una firma temporal para subir una imagen
mediaRouter.post('/uploads/sign',(req,res,next)=>{try{res.json({success:true,data:signDirectImageUpload(res.locals.authenticatedUser as AuthUser,req.body)});}catch(error){next(error);}});
// mediaRouter.post('/uploads/complete'): Verifica la carga directa de una imagen
mediaRouter.post('/uploads/complete',async(req,res,next)=>{try{const data=await verifyDirectImageUpload(res.locals.authenticatedUser as AuthUser,req.body);res.json({success:true,data});}catch(error){next(error);}});
