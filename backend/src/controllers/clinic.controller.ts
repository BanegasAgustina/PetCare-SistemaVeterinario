// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

/**
 * Adapta solicitudes de clínica al servicio y al contrato JSON. Pasa el actor autenticado y los parámetros; los permisos y el alcance se controlan antes de consultar o modificar datos.
 */
import type { RequestHandler } from 'express';
import { clinicOperation } from '../services/clinic.service';
import { presentProductImages } from '../services/pet-photo.service';
import type { AuthUser } from '../types/auth';
import { runDatabaseOperation } from '../utils/database-error';
// Función clinicHandler: concentra la lógica dentro de este módulo.
export function clinicHandler(operation:string,status=200):RequestHandler {
 return async(req,res,next)=>{try{const query=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};const data=await runDatabaseOperation(()=>clinicOperation(res.locals.authenticatedUser as AuthUser,operation,req.params.id,req.body,query,req.params.kind as string|undefined));res.status(status).json({success:true,data:operation==='products'||operation==='admin-list'&&req.params.kind==='products'?await presentProductImages(data):data});}catch(error){next(error);}};
}
