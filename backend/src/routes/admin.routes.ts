// Este archivo se encarga de lo siguiente: Código fuente de la aplicación; reúne declaraciones y operaciones relacionadas con su módulo.

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
import * as account from '../services/admin-account.service';
import * as generalInformation from '../repositories/general-information.repository';
// Función handle: atiende una acción o evento dentro de este módulo.
function handle(operation:(req:Request,res:Response)=>Promise<unknown>,status=200):RequestHandler {
  return async(req,res,next)=>{try{res.status(status).json({success:true,data:await operation(req,res)});}catch(error){next(error);}};
}
// Función actor: concentra una operación reutilizable de este módulo.
const actor=(res:Response)=>res.locals.authenticatedUser as AuthUser;
// Función updateProduct: actualiza o guarda información dentro de este módulo.
async function updateProduct(req:Request,res:Response) {
  const identity=actor(res);const raw=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
  const {photoBase64,...fields}=raw;
  if(photoBase64===undefined){const result=await repository.updateAdminProduct(identity,identifier(req.params.id),fields);if(fields.imageUrl!==undefined&&fields.imageUrl!==result.previousImage&&isProductPhotoKey(result.previousImage))await removeProductPhoto(result.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {updated:true};}
  if(!identity.permissions?.includes('products.update'))throw new AppError('FORBIDDEN',403,'No tenés permiso para modificar imágenes de productos.');
  const image=await storeProductPhoto(photoBase64);
  try{const result=await repository.updateAdminProduct(identity,identifier(req.params.id),{...fields,imageUrl:image.url});if(result.previousImage!==image.url&&isProductPhotoKey(result.previousImage))await removeProductPhoto(result.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {updated:true};}
  catch(error){await image.remove().catch(()=>console.error('No se pudo limpiar una imagen de producto sin referencia.'));throw error;}
}
// Función updateUserPhoto: actualiza o guarda información dentro de este módulo.
async function updateUserPhoto(req:Request,res:Response) {
  const identity=actor(res);const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
  if(Object.keys(body).some(key=>!['photoBase64','photoUrl','removePhoto'].includes(key))||body.removePhoto!==undefined&&typeof body.removePhoto!=='boolean'||body.removePhoto===true&&(body.photoBase64!==undefined||body.photoUrl!==undefined)||body.photoBase64!==undefined&&body.photoUrl!==undefined)throw new AppError('VALIDATION_ERROR',400,'La solicitud de foto no es válida.');
  if(body.photoUrl!==undefined&&!isProfilePhotoKey(body.photoUrl))throw new AppError('VALIDATION_ERROR',400,'La referencia de foto no es válida.');
  const remove=body.removePhoto===true;const image=remove?null:body.photoUrl?{url:String(body.photoUrl),remove:async()=>{}}:body.photoBase64!==undefined?await storeProfilePhoto(body.photoBase64):null;
  if(!remove&&!image)throw new AppError('VALIDATION_ERROR',400,'Seleccioná una foto de perfil.');
  try {const result=await repository.updateAdminUserPhoto(identity,identifier(req.params.id),image?.url??null);if(isProfilePhotoKey(result.previous)&&result.previous!==image?.url)await removeProfilePhoto(result.previous).catch(()=>console.error('No se pudo limpiar la foto de perfil anterior.'));return {updated:true};}
  catch(error){if(image)await image.remove().catch(()=>console.error('No se pudo limpiar una foto de perfil sin referencia.'));throw error;}
}
// Dato adminRouter: conserva un valor calculado o de configuración usado por este módulo.
export const adminRouter=Router();
adminRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
adminRouter.use(authenticate);
adminRouter.post('/home',requireRole('ADMIN','SUPER_ADMIN'),handle(async(_req,res)=>repository.adminHome(actor(res))));
adminRouter.post('/general-information',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('settings.general.manage'),handle(async(_req,res)=>generalInformation.adminGeneralInformation(actor(res))));
adminRouter.put('/general-information',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('settings.general.manage'),handle(async(req,res)=>generalInformation.saveGeneralInformation(actor(res),req.body)));
adminRouter.put('/account',requireRole('ADMIN','SUPER_ADMIN'),handle(async(req,res)=>account.updateOwnProfile(actor(res).id,req.body)));
adminRouter.put('/account/password',requireRole('ADMIN','SUPER_ADMIN'),createAuthRateLimiter(),handle(async(req,res)=>account.changeOwnPassword(actor(res).id,req.body)));
adminRouter.post('/catalog',requireRole('ADMIN','SUPER_ADMIN'),requireAnyPermission('users.manage','roles.manage','permissions.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.post('/users/query',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('users.manage'),handle(async req=>repository.adminUsers(req.body)));
adminRouter.post('/users/:id',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('users.manage'),handle(async req=>repository.adminUser(identifier(req.params.id))));
adminRouter.delete('/users/:id',requireRole('SUPER_ADMIN'),requirePermission('users.manage'),handle(async(req,res)=>repository.deactivateAdminUser(actor(res),identifier(req.params.id))));
adminRouter.post('/users',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('users.manage','roles.manage'),createAuthRateLimiter(),handle(async(req,res)=>repository.createAdminUser(actor(res),req.body),201));
adminRouter.post('/users/:id/invitation',requireRole('SUPER_ADMIN'),createAuthRateLimiter(4),handle(async(req,res)=>repository.resendAdminInvitation(actor(res),identifier(req.params.id))));
adminRouter.put('/users/:id',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('users.manage'),handle(async(req,res)=>repository.updateAdminUser(actor(res),identifier(req.params.id),req.body)));
adminRouter.put('/users/:id/photo',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('users.manage'),handle(updateUserPhoto));
adminRouter.put('/users/:id/permissions',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('users.manage','permissions.manage'),handle(async(req,res)=>repository.updateUserPermissions(actor(res),identifier(req.params.id),req.body)));
adminRouter.post('/roles/query',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('roles.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.post('/roles',requireRole('SUPER_ADMIN'),requirePermission('roles.manage','permissions.manage'),createAuthRateLimiter(),handle(async(req,res)=>repository.createRole(actor(res),req.body),201));
adminRouter.put('/roles/:id',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('roles.manage','permissions.manage'),handle(async(req,res)=>repository.updateRole(actor(res),identifier(req.params.id),req.body)));
adminRouter.delete('/roles/:id',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('roles.manage','permissions.manage'),handle(async(req,res)=>repository.deleteCustomRole(actor(res),identifier(req.params.id))));
adminRouter.post('/permissions/query',requireRole('ADMIN','SUPER_ADMIN'),requirePermission('permissions.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
adminRouter.post('/products/query',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(async req=>presentProductImages(await repository.adminProducts(req.body))));
adminRouter.post('/products/catalog',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(async(_req,res)=>repository.adminProductCategories(actor(res))));
adminRouter.post('/products/:id/stock-movements',requirePermission('products.update_stock'),handle(async(req,res)=>repository.adminProductStockMovements(actor(res),identifier(req.params.id))));
adminRouter.patch('/products/:id',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(updateProduct));
