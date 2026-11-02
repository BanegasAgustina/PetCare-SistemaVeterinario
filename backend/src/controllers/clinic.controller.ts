/**
 * ARCHIVO: clinic.controller.ts
 * UBICACIÓN: backend/src/controllers/clinic.controller.ts
 * FUNCIÓN: Crea manejadores HTTP para operaciones del área clínica y administrativa.
 * RESPONSABILIDAD: Obtener identidad autenticada, invocar clinic.service.ts y responder con sobre JSON uniforme.
 * CONEXIONES: Importa: backend/src/services/clinic.service.ts, backend/src/services/pet-photo.service.ts, backend/src/types/auth.ts, backend/src/utils/database-error.ts Se utiliza desde: backend/src/routes/clinic.routes.ts
 * FUNCIONAMIENTO: Lee la solicitud, llama a la operación del dominio y convierte su resultado o error en respuesta HTTP.
 * IMPORTANCIA: Separa el protocolo HTTP de las reglas clínicas y consultas de datos.
 */
/**
 * Adapta solicitudes de clínica al servicio y al contrato JSON. Pasa el actor autenticado y los parámetros; los permisos y el alcance se controlan antes de consultar o modificar datos.
 */
import type { RequestHandler } from 'express';
import { clinicOperation } from '../services/clinic.service';
import { presentProductImages } from '../services/pet-photo.service';
import type { AuthUser } from '../types/auth';
import { runDatabaseOperation } from '../utils/database-error';
/** Crea un handler parametrizado por operación de clínica y estado HTTP de éxito. */
export function clinicHandler(operation:string,status=200):RequestHandler {
 return async(req,res,next)=>{try{const query=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};const data=await runDatabaseOperation(()=>clinicOperation(res.locals.authenticatedUser as AuthUser,operation,req.params.id,req.body,query,req.params.kind as string|undefined));res.status(status).json({success:true,data:operation==='products'||operation==='admin-list'&&req.params.kind==='products'?await presentProductImages(data):data});}catch(error){next(error);}};
}
