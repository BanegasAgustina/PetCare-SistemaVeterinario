/**
 * Adapta las operaciones del cliente a HTTP y presenta fotos autorizadas. Obtiene owner desde el usuario validado por JWT y delega al servicio; no acepta identidad libre del body.
 */
import type { RequestHandler } from 'express';
import type { AuthUser } from '../types/auth';
import { clientOperation } from '../services/client.service';
import { presentPetPhotos } from '../services/pet-photo.service';
export function clientHandler(operation:string,status=200):RequestHandler {
  return async(req,res,next)=>{try{const user=res.locals.authenticatedUser as AuthUser;
    const data=await clientOperation(user.id,operation,req.params.id??req.params.kind,req.body,req.query);
    res.status(status).json({success:true,data:await presentPetPhotos(user.id,data)});
  }catch(error){next(error);}};
}
