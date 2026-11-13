/** Correlaciona login/refresh sin registrar cuerpos, credenciales, tokens ni datos de usuario. */
import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';

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
  });
  response.once('close',()=>{
    if(!finished)console.warn('[PetCare Auth Request]',JSON.stringify({requestId,endpoint,event:'connection_closed',status:response.statusCode,durationMs:Date.now()-startedAt,completed:false}));
  });
  next();
};
