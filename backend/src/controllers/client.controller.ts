import type { RequestHandler } from 'express';
import type { AuthUser } from '../types/auth';
import { clientOperation } from '../services/client.service';
export function clientHandler(operation:string,status=200):RequestHandler {
  return async(req,res,next)=>{try{const user=res.locals.authenticatedUser as AuthUser;
    const data=await clientOperation(user.id,operation,req.params.id??req.params.kind,req.body,req.query);
    res.status(status).json({success:true,data});
  }catch(error){next(error);}};
}
