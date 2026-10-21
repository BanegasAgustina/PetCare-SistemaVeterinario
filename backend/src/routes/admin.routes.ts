/** Cada recurso administrativo exige identidad JWT, rol permitido y permiso real. */
import { Router,type Request,type Response,type RequestHandler } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole,requirePermission,requireAnyPermission } from '../middlewares/permission.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { identifier } from '../validators/veterinarian.validator';
import type { AuthUser } from '../types/auth';
import * as repository from '../repositories/admin.repository';
import { isProductPhotoKey,isProfilePhotoKey,presentProductImages,removeProductPhoto,removeProfilePhoto,storeProductPhoto,storeProfilePhoto } from '../services/pet-photo.service';
import { AppError } from '../utils/app-error';
function handle(operation:(req:Request,res:Response)=>Promise<unknown>,status=200):RequestHandler {
  return async(req,res,next)=>{try{res.status(status).json({success:true,data:await operation(req,res)});}catch(error){next(error);}};
}
const actor=(res:Response)=>res.locals.authenticatedUser as AuthUser;
async function updateProduct(req:Request,res:Response) {
  const identity=actor(res);const raw=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
  const {photoBase64,...fields}=raw;
  if(photoBase64===undefined){const result=await repository.updateAdminProduct(identity,identifier(req.params.id),fields);if(fields.imageUrl!==undefined&&fields.imageUrl!==result.previousImage&&isProductPhotoKey(result.previousImage))await removeProductPhoto(result.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {updated:true};}
  if(!identity.permissions?.includes('products.update'))throw new AppError('FORBIDDEN',403,'No tenés permiso para modificar imágenes de productos.');
  const image=await storeProductPhoto(photoBase64);
  try{const result=await repository.updateAdminProduct(identity,identifier(req.params.id),{...fields,imageUrl:image.url});if(result.previousImage!==image.url&&isProductPhotoKey(result.previousImage))await removeProductPhoto(result.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {updated:true};}
  catch(error){await image.remove().catch(()=>console.error('No se pudo limpiar una imagen de producto sin referencia.'));throw error;}
}
async function updateUserPhoto(req:Request,res:Response) {
  const identity=actor(res);const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
  if(Object.keys(body).some(key=>!['photoBase64','removePhoto'].includes(key))||body.removePhoto!==undefined&&typeof body.removePhoto!=='boolean'||body.removePhoto===true&&body.photoBase64!==undefined)throw new AppError('VALIDATION_ERROR',400,'La solicitud de foto no es válida.');
  const remove=body.removePhoto===true;const image=remove?null:await storeProfilePhoto(body.photoBase64);
  try {const result=await repository.updateAdminUserPhoto(identity,identifier(req.params.id),image?.url??null);if(isProfilePhotoKey(result.previous)&&result.previous!==image?.url)await removeProfilePhoto(result.previous).catch(()=>console.error('No se pudo limpiar la foto de perfil anterior.'));return {updated:true};}
  catch(error){if(image)await image.remove().catch(()=>console.error('No se pudo limpiar una foto de perfil sin referencia.'));throw error;}
}
export const adminRouter=Router();
adminRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
adminRouter.use(authenticate,requireRole('ADMIN','SUPER_ADMIN'));
adminRouter.get('/home',handle(async(_req,res)=>repository.adminHome(actor(res))));
adminRouter.get('/catalog',requireAnyPermission('users.manage','roles.manage','permissions.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.get('/users',requirePermission('users.manage'),handle(async req=>repository.adminUsers(req.query)));
adminRouter.get('/users/:id',requirePermission('users.manage'),handle(async req=>repository.adminUser(identifier(req.params.id))));
adminRouter.post('/users',requirePermission('users.manage','roles.manage'),createAuthRateLimiter(),handle(async(req,res)=>repository.createAdminUser(actor(res),req.body),201));
adminRouter.put('/users/:id',requirePermission('users.manage'),handle(async(req,res)=>repository.updateAdminUser(actor(res),identifier(req.params.id),req.body)));
adminRouter.put('/users/:id/photo',requirePermission('users.manage'),handle(updateUserPhoto));
adminRouter.put('/users/:id/permissions',requirePermission('users.manage','permissions.manage'),handle(async(req,res)=>repository.updateUserPermissions(actor(res),identifier(req.params.id),req.body)));
adminRouter.get('/roles',requirePermission('roles.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.put('/roles/:id',requirePermission('roles.manage','permissions.manage'),handle(async(req,res)=>repository.updateRole(actor(res),identifier(req.params.id),req.body)));
adminRouter.get('/permissions',requirePermission('permissions.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.get('/products',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(async req=>presentProductImages(await repository.adminProducts(req.query))));
adminRouter.get('/products/:id/stock-movements',requirePermission('products.update_stock'),handle(async(req,res)=>repository.adminProductStockMovements(actor(res),identifier(req.params.id))));
adminRouter.patch('/products/:id',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(updateProduct));
