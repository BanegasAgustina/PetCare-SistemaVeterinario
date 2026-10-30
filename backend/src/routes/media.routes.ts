import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import type { AuthUser } from '../types/auth';
import { signDirectImageUpload,verifyDirectImageUpload } from '../services/direct-image-upload.service';

export const mediaRouter=Router();
mediaRouter.use(authenticate,createAuthRateLimiter(30));
mediaRouter.post('/uploads/sign',(req,res,next)=>{try{res.json({success:true,data:signDirectImageUpload(res.locals.authenticatedUser as AuthUser,req.body)});}catch(error){next(error);}});
mediaRouter.post('/uploads/complete',async(req,res,next)=>{try{const data=await verifyDirectImageUpload(res.locals.authenticatedUser as AuthUser,req.body);res.json({success:true,data});}catch(error){next(error);}});
