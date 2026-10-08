/**
 * Adapta solicitudes de clínica al servicio y al contrato JSON. Pasa el actor autenticado y los parámetros; los permisos y el alcance se controlan antes de consultar o modificar datos.
 */
import type { RequestHandler } from 'express';
import { clinicOperation } from '../services/clinic.service';
import type { AuthUser } from '../types/auth';
export function clinicHandler(operation:string,status=200):RequestHandler {
 return async(req,res,next)=>{try{res.status(status).json({success:true,data:await clinicOperation(res.locals.authenticatedUser as AuthUser,operation,req.params.id,req.body,req.query,req.params.kind as string|undefined)});}catch(error){next(error);}};
}
