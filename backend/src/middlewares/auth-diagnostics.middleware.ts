/** Correlaciona login/refresh sin registrar cuerpos, credenciales, tokens ni datos de usuario.
 * Lleva un registro técnico de las solicitudes de inicio de sesión y renovación de sesión. 
 * Les asigna un identificador para poder seguirlas en los registros, sin guardar contraseñas, 
 * tokens ni datos personales.
 * 
 * registra el inicio y resultado de login/reservation con un identificador sin guardar secretos ni datos personales 
 * 
 */
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
//authrequesdiagnostics realiza un seguimiento de las solicitudes de login y refresh, 
// asignando un identificador único a cada solicitud y registrando su inicio y finalización sin almacenar datos sensibles.
export const authRequestDiagnostics:RequestHandler=(request,response,next)=>{
  if(request.method!=='POST'||!['/login','/refresh'].includes(request.path))return next();
  const supplied=request.get('x-request-id')??'';
  const requestId=/^[a-zA-Z0-9-]{8,80}$/.test(supplied)?supplied:randomUUID();
  const endpoint=`/api/auth${request.path}`;
  const startedAt=Date.now();
  let finished=false;
  response.setHeader('X-Request-ID',requestId);
  console.info('[PetCare Auth Request]',JSON.stringify({requestId,endpoint,event:'received'}));
  response.once('finish',()=>{
    finished=true;
    console.info('[PetCare Auth Request]',JSON.stringify({requestId,endpoint,event:'completed',status:response.statusCode,durationMs:Date.now()-startedAt,completed:true}));
  });// Registra el cierre de la conexión si la respuesta se cierra antes de finalizar, indicando que la solicitud no se completó correctamente.
  response.once('close',()=>{
    if(!finished)console.warn('[PetCare Auth Request]',JSON.stringify({requestId,endpoint,event:'connection_closed',status:response.statusCode,durationMs:Date.now()-startedAt,completed:false}));
  });
  next();
};
