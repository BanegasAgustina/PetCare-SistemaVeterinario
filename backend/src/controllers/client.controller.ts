/**
 * ARCHIVO: client.controller.ts
 * UBICACIÓN: backend/src/controllers/client.controller.ts
 * FUNCIÓN: Crea manejadores HTTP para operaciones del área cliente y notificaciones.
 * RESPONSABILIDAD: Pasar identidad autenticada, argumentos y resultado de servicio al sobre JSON de API.
 * CONEXIONES: Importa: backend/src/types/auth.ts, backend/src/services/client.service.ts, backend/src/services/pet-photo.service.ts Se utiliza desde: backend/src/routes/client.routes.ts, backend/src/routes/notification.routes.ts
 * FUNCIONAMIENTO: Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.
 * IMPORTANCIA: Mantiene la traducción entre rutas de cliente y client.service.ts en una capa aislada.
 */
/**
 * Adapta las operaciones del cliente a HTTP y presenta fotos autorizadas. Obtiene owner desde el usuario validado por JWT y delega al servicio; no acepta identidad libre del body.
 */
import type { RequestHandler } from 'express';
import type { AuthUser } from '../types/auth';
import { clientOperation } from '../services/client.service';
import { presentPetPhotos } from '../services/pet-photo.service';
/** Crea un RequestHandler que ejecuta la operación indicada y presenta fotos de mascotas si corresponde. */
export function createClientHandler(operation:string,status=200,run:typeof clientOperation=clientOperation,present:typeof presentPetPhotos=presentPetPhotos):RequestHandler {
  return async(req,res,next)=>{try{const user=res.locals.authenticatedUser as AuthUser;
    const body=operation==='payment-proof'?{bytes:req.body,contentType:req.get('content-type'),reference:req.get('x-payment-reference')}:req.body;
    const query=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
    const data=await run(user.id,operation,req.params.id??req.params.kind,body,query,user);
    res.status(status).json({success:true,data:await present(user.id,data)});
  }catch(error){next(error);}};
}
/** Atajo para crear handler con las dependencias de cliente predeterminadas. */
export function clientHandler(operation:string,status=200):RequestHandler{return createClientHandler(operation,status);}
