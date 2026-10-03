/** Cada recurso administrativo exige identidad JWT, rol permitido y permiso real. */
import { Router,type Request,type Response,type RequestHandler } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole,requirePermission,requireAnyPermission } from '../middlewares/permission.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { identifier } from '../validators/veterinarian.validator';
import type { AuthUser } from '../types/auth';
import * as repository from '../repositories/admin.repository';
function handle(operation:(req:Request,res:Response)=>Promise<unknown>,status=200):RequestHandler {
  return async(req,res,next)=>{try{res.status(status).json({success:true,data:await operation(req,res)});}catch(error){next(error);}};
}
const actor=(res:Response)=>res.locals.authenticatedUser as AuthUser;
export const adminRouter=Router();
adminRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
adminRouter.use(authenticate,requireRole('ADMIN','SUPER_ADMIN'));
adminRouter.get('/home',handle(async(_req,res)=>repository.adminHome(actor(res))));
adminRouter.get('/catalog',requireAnyPermission('users.manage','roles.manage','permissions.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.get('/users',requirePermission('users.manage'),handle(async req=>repository.adminUsers(req.query)));
adminRouter.get('/users/:id',requirePermission('users.manage'),handle(async req=>repository.adminUser(identifier(req.params.id))));
adminRouter.post('/users',requirePermission('users.manage','roles.manage'),createAuthRateLimiter(),handle(async(req,res)=>repository.createAdminUser(actor(res),req.body),201));
adminRouter.put('/users/:id',requirePermission('users.manage'),handle(async(req,res)=>repository.updateAdminUser(actor(res),identifier(req.params.id),req.body)));
adminRouter.put('/users/:id/permissions',requirePermission('users.manage','permissions.manage'),handle(async(req,res)=>repository.updateUserPermissions(actor(res),identifier(req.params.id),req.body)));
adminRouter.post('/users/:id/invitation',requirePermission('users.manage'),createAuthRateLimiter(),handle(async(req,res)=>repository.inviteAdminUser(actor(res),identifier(req.params.id))));
adminRouter.get('/roles',requirePermission('roles.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.put('/roles/:id',requirePermission('roles.manage','permissions.manage'),handle(async(req,res)=>repository.updateRole(actor(res),identifier(req.params.id),req.body)));
adminRouter.get('/permissions',requirePermission('permissions.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.get('/products',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(async req=>repository.adminProducts(req.query)));
adminRouter.patch('/products/:id',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(async(req,res)=>repository.updateAdminProduct(actor(res),identifier(req.params.id),req.body)));
