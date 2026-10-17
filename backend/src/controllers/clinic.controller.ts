/**
 * Adapta solicitudes de clínica al servicio y al contrato JSON. Pasa el actor autenticado y los parámetros; los permisos y el alcance se controlan antes de consultar o modificar datos.
 */
import type { RequestHandler } from 'express';
import { clinicOperation } from '../services/clinic.service';
import { presentProductImages } from '../services/pet-photo.service';
import type { AuthUser } from '../types/auth';
import { runDatabaseOperation } from '../utils/database-error';
export function clinicHandler(operation:string,status=200):RequestHandler {
 return async(req,res,next)=>{try{const data=await runDatabaseOperation(()=>clinicOperation(res.locals.authenticatedUser as AuthUser,operation,req.params.id,req.body,req.query,req.params.kind as string|undefined));res.status(status).json({success:true,data:operation==='products'||operation==='admin-list'&&req.params.kind==='products'?await presentProductImages(data):data});}catch(error){next(error);}};
}
