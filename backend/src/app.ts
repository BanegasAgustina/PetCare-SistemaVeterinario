// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/** Construye Express separado del puerto de escucha para facilitar pruebas HTTP. */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, isVercelRuntime } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { authenticate } from './middlewares/auth.middleware';
import { requireRole,requirePermission,requirePersonalAccess } from './middlewares/permission.middleware';
import { createAuthRateLimiter } from './middlewares/auth-rate-limit.middleware';
import { configureProxyTrust } from './middlewares/proxy-trust.middleware';
import { pet } from './repositories/client.repository';
import { petPhotoUrl } from './services/pet-photo.service';
import { clientId } from './validators/client.validator';
import { notificationJobsRouter } from './routes/notification-jobs.routes';

// Dato app: conserva un valor calculado o de configuración usado por este módulo.
export const app = express();
// Vercel detecta este archivo como la entrada Express cuando recibe un default export.
export default app;
configureProxyTrust(app, isVercelRuntime);
app.disable('x-powered-by');
// Solo se habilitan la web oficial y sus previews de Vercel; el cliente nativo no necesita CORS.
app.use(cors({ origin: (origin, callback) => callback(null, env.isCorsOriginAllowed(origin)), methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization','X-Payment-Reference'] }));
app.use(helmet({strictTransportSecurity:env.nodeEnvironment==='production'?undefined:false,contentSecurityPolicy:false}));
// Dato photoUploadLimiter: conserva un valor calculado o de configuración usado por este módulo.
const photoUploadLimiter=createAuthRateLimiter();
// El cuerpo de fotos se procesa solo tras autenticar; el resto conserva su límite.
app.use(/^\/api\/client\/pets(?:\/\d+)?$/, (req,res,next)=> {
  const petUpload=(req.method==='POST'&&req.path==='/api/client/pets')||(req.method==='PUT'&&/^\/api\/client\/pets\/\d+$/.test(req.path));
  if(!petUpload)return next();
  authenticate(req,res,error=>{if(error)return next(error);requirePersonalAccess(req,res,roleError=>{if(roleError)return next(roleError);photoUploadLimiter(req,res,limitError=>{if(limitError)return next(limitError);express.json({limit:'8mb'})(req,res,next);});});});
});
app.use(/^\/api\/client\/payment-intents\/\d+\/proof$/, (req,res,next)=>{
  if(req.method!=='POST')return next();
  authenticate(req,res,error=>{if(error)return next(error);requirePersonalAccess(req,res,roleError=>{if(roleError)return next(roleError);photoUploadLimiter(req,res,limitError=>{if(limitError)return next(limitError);express.raw({type:['application/pdf','image/jpeg','image/png','image/webp'],limit:'5mb'})(req,res,next);});});});
});
app.use('/api/vet/profile/photo',(req,res,next)=>{
  if(req.method!=='PUT')return next();
  authenticate(req,res,error=>{if(error)return next(error);requireRole('VETERINARIAN')(req,res,roleError=>{if(roleError)return next(roleError);photoUploadLimiter(req,res,limitError=>{if(limitError)return next(limitError);express.json({limit:'8mb'})(req,res,next);});});});
});
app.use(/^\/api\/(?:admin\/(?:products\/\d+|users\/\d+\/photo)|admin\/veterinarians\/\d+\/photo|clinic\/admin\/(?:products|services)(?:\/\d+)?)$/, (req,res,next)=> {
  if(!['POST','PATCH','PUT'].includes(req.method))return next();
  authenticate(req,res,error=>{if(error)return next(error);const authorize=/^\/api\/(?:admin\/products\/\d+|clinic\/admin\/products(?:\/\d+)?)$/.test(req.path)?requirePermission('products.update'):/^\/api\/clinic\/admin\/services(?:\/\d+)?$/.test(req.path)?requirePermission('services.manage'):requireRole('ADMIN','SUPER_ADMIN');authorize(req,res,roleError=>{if(roleError)return next(roleError);photoUploadLimiter(req,res,limitError=>{if(limitError)return next(limitError);express.json({limit:'8mb'})(req,res,next);});});});
});
app.use(express.json({ limit: '100kb' }));
app.use('/api/cron/notifications', notificationJobsRouter);
// Lectura privada por ID de mascota; nunca aceptar una clave arbitraria del cliente.
app.get('/media/pets/:id',authenticate,requirePersonalAccess,createAuthRateLimiter(120),async(req,res,next)=>{
  try {const owned=await pet(res.locals.authenticatedUser.id,clientId(req.params.id));
    const url=await petPhotoUrl(res.locals.authenticatedUser.id,owned.photoUrl);
    res.setHeader('Cache-Control','no-store');res.json({success:true,data:{url}});
  }catch(error){next(error);}
});
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
