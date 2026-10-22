/**
 * Adapta las operaciones del cliente a HTTP y presenta fotos autorizadas. Obtiene owner desde el usuario validado por JWT y delega al servicio; no acepta identidad libre del body.
 */
import type { RequestHandler } from 'express';
import type { AuthUser } from '../types/auth';
import { clientOperation } from '../services/client.service';
import { presentPetPhotos } from '../services/pet-photo.service';
export function clientHandler(operation:string,status=200):RequestHandler {
  return async(req,res,next)=>{try{const user=res.locals.authenticatedUser as AuthUser;
    const body=operation==='payment-proof'?{bytes:req.body,contentType:req.get('content-type'),reference:req.get('x-payment-reference')}:req.body;
    const data=await clientOperation(user.id,operation,req.params.id??req.params.kind,body,req.query,user);
    res.status(status).json({success:true,data:await presentPetPhotos(user.id,data)});
  }catch(error){next(error);}};
}
