/** Construye Express separado del puerto de escucha para facilitar pruebas HTTP. */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { apiRouter } from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { authenticate } from './middlewares/auth.middleware';
import { requireRole } from './middlewares/permission.middleware';
import { createAuthRateLimiter } from './middlewares/auth-rate-limit.middleware';
import { pet } from './repositories/client.repository';
import { petPhotoUrl } from './services/pet-photo.service';
import { clientId } from './validators/client.validator';

export const app = express();
// Vercel detecta este archivo como la entrada Express cuando recibe un default export.
export default app;
app.disable('x-powered-by');
// Solo se habilitan orígenes web explícitos. El cliente React Native no necesita CORS.
app.use(cors({ origin: (origin, callback) => callback(null, !origin || env.corsAllowedOrigins.includes(origin)), methods: ['GET', 'POST', 'PUT', 'PATCH', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(helmet({strictTransportSecurity:process.env.NODE_ENV==='production'?undefined:false,contentSecurityPolicy:false}));
const photoUploadLimiter=createAuthRateLimiter();
// El cuerpo de fotos se procesa solo tras autenticar; el resto conserva su límite.
app.use(/^\/api\/client\/pets(?:\/\d+)?$/, (req,res,next)=> {
  if(!['POST','PUT'].includes(req.method))return next();
  authenticate(req,res,error=>{if(error)return next(error);requireRole('CLIENT')(req,res,roleError=>{if(roleError)return next(roleError);photoUploadLimiter(req,res,limitError=>{if(limitError)return next(limitError);express.json({limit:'8mb'})(req,res,next);});});});
});
app.use(/^\/api\/(?:admin\/(?:products\/\d+|users\/\d+\/photo)|admin\/veterinarians\/\d+\/photo|clinic\/admin\/products(?:\/\d+)?)$/, (req,res,next)=> {
  if(!['POST','PATCH','PUT'].includes(req.method))return next();
  authenticate(req,res,error=>{if(error)return next(error);requireRole('ADMIN','SUPER_ADMIN')(req,res,roleError=>{if(roleError)return next(roleError);photoUploadLimiter(req,res,limitError=>{if(limitError)return next(limitError);express.json({limit:'8mb'})(req,res,next);});});});
});
app.use(express.json({ limit: '100kb' }));
// Lectura privada por ID de mascota; nunca aceptar una clave arbitraria del cliente.
app.get('/media/pets/:id',authenticate,requireRole('CLIENT'),createAuthRateLimiter(120),async(req,res,next)=>{
  try {const owned=await pet(res.locals.authenticatedUser.id,clientId(req.params.id));
    const url=await petPhotoUrl(res.locals.authenticatedUser.id,owned.photoUrl);
    res.setHeader('Cache-Control','no-store');res.json({success:true,data:{url}});
  }catch(error){next(error);}
});
app.use('/api', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
