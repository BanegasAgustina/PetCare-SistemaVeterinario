// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/**
 * Adapta las operaciones del cliente a HTTP y presenta fotos autorizadas. Obtiene owner desde el usuario validado por JWT y delega al servicio; no acepta identidad libre del body.
 */
import type { RequestHandler } from 'express';
import type { AuthUser } from '../types/auth';
import { clientOperation } from '../services/client.service';
import { presentPetPhotos } from '../services/pet-photo.service';
// Función clientHandler: concentra la lógica dentro de este módulo.
export function createClientHandler(operation:string,status=200,run:typeof clientOperation=clientOperation,present:typeof presentPetPhotos=presentPetPhotos):RequestHandler {
  return async(req,res,next)=>{try{const user=res.locals.authenticatedUser as AuthUser;
    const body=operation==='payment-proof'?{bytes:req.body,contentType:req.get('content-type'),reference:req.get('x-payment-reference')}:req.body;
    const query=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
    const data=await run(user.id,operation,req.params.id??req.params.kind,body,query,user);
    res.status(status).json({success:true,data:await present(user.id,data)});
  }catch(error){next(error);}};
}
export function clientHandler(operation:string,status=200):RequestHandler{return createClientHandler(operation,status);}
