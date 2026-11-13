/**
 * ARCHIVO: admin.routes.ts
 * UBICACIÓN: backend/src/routes/admin.routes.ts
 * FUNCIÓN: Declara endpoints de administración de usuarios, roles, permisos y tienda.
 * RESPONSABILIDAD: Aplicar autenticación, permisos y validación antes de delegar las acciones administrativas.
 * CONEXIONES: Importa: backend/src/middlewares/auth.middleware.ts, backend/src/middlewares/permission.middleware.ts, backend/src/middlewares/auth-rate-limit.middleware.ts, backend/src/validators/veterinarian.validator.ts, backend/src/types/auth.ts, backend/src/repositories/admin.repository.ts, backend/src/services/pet-photo.service.ts, backend/src/utils/app-error.ts y 2 más Se utiliza desde: backend/src/routes/index.ts
 * FUNCIONAMIENTO: Usa middlewares de auth/permission y validadores; handlers obtienen el actor de res.locals y llaman a operaciones de administración.
 * IMPORTANCIA: Define la superficie /admin y protege las operaciones más sensibles detrás de permisos del backend.
 */
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
// Adapta una operación de repositorio a un handler y maneja errores de base.
function handle(operation:(req:Request,res:Response)=>Promise<unknown>,status=200):RequestHandler {
  return async(req,res,next)=>{try{res.status(status).json({success:true,data:await operation(req,res)});}catch(error){next(error);}};
}
// Obtiene de locals el usuario ya autenticado y verificado por middleware.
const actor=(res:Response)=>res.locals.authenticatedUser as AuthUser;
// Actualiza producto y mantiene la limpieza de fotos reemplazadas.
async function updateProduct(req:Request,res:Response) {
  const identity=actor(res);const raw=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
  const {photoBase64,...fields}=raw;
  if(photoBase64===undefined){const result=await repository.updateAdminProduct(identity,identifier(req.params.id),fields);if(fields.imageUrl!==undefined&&fields.imageUrl!==result.previousImage&&isProductPhotoKey(result.previousImage))await removeProductPhoto(result.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {updated:true};}
  if(!identity.permissions?.includes('products.update'))throw new AppError('FORBIDDEN',403,'No tenés permiso para modificar imágenes de productos.');
  const image=await storeProductPhoto(photoBase64);
  try{const result=await repository.updateAdminProduct(identity,identifier(req.params.id),{...fields,imageUrl:image.url});if(result.previousImage!==image.url&&isProductPhotoKey(result.previousImage))await removeProductPhoto(result.previousImage).catch(()=>console.error('No se pudo limpiar la imagen anterior del producto.'));return {updated:true};}
  catch(error){await image.remove().catch(()=>console.error('No se pudo limpiar una imagen de producto sin referencia.'));throw error;}
}
// Actualiza referencia fotográfica solo tras validar rol de la cuenta.
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
// adminRouter.use: Evita que se almacenen en caché las respuestas de este router.
adminRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
// adminRouter.use: Aplica los controles compartidos a las rutas siguientes.
adminRouter.use(authenticate);
// adminRouter.post('/home'): Devuelve el resumen del panel administrativo Controles: roles: ADMIN, SUPER_ADMIN.
adminRouter.post('/home',handle(async(_req,res)=>repository.adminHome(actor(res))));
// adminRouter.post('/general-information'): Consulta la información general de la clínica Controles: roles: ADMIN, SUPER_ADMIN; permisos: settings.general.manage.
adminRouter.post('/general-information',requirePermission('settings.general.manage'),handle(async(_req,res)=>generalInformation.adminGeneralInformation(actor(res))));
// adminRouter.put('/general-information'): Consulta la información general de la clínica Controles: roles: ADMIN, SUPER_ADMIN; permisos: settings.general.manage.
adminRouter.put('/general-information',requirePermission('settings.general.manage'),handle(async(req,res)=>generalInformation.saveGeneralInformation(actor(res),req.body)));
// adminRouter.put('/account'): Actualiza el perfil del administrador autenticado Controles: roles: ADMIN, SUPER_ADMIN.
adminRouter.put('/account',handle(async(req,res)=>account.updateOwnProfile(actor(res).id,req.body)));
// adminRouter.put('/account/password'): Cambia la contraseña del administrador autenticado Controles: roles: ADMIN, SUPER_ADMIN; límite de solicitudes.
adminRouter.put('/account/password',createAuthRateLimiter(),handle(async(req,res)=>account.changeOwnPassword(actor(res).id,req.body)));
// adminRouter.post('/catalog'): Consulta catálogos administrativos Controles: roles: ADMIN, SUPER_ADMIN; permisos: users.manage, roles.manage, permissions.manage.
adminRouter.post('/catalog',requireAnyPermission('users.manage','roles.manage','permissions.manage','professional_types.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
// adminRouter.post('/users/query'): Lista usuarios Controles: roles: ADMIN, SUPER_ADMIN; permisos: users.manage.
adminRouter.post('/users/query',requirePermission('users.manage'),handle(async req=>repository.adminUsers(req.body)));
// adminRouter.post('/users/:id'): Consulta un usuario por identificador Controles: roles: ADMIN, SUPER_ADMIN; permisos: users.manage.
adminRouter.post('/users/:id',requirePermission('users.manage'),handle(async req=>repository.adminUser(identifier(req.params.id))));
// adminRouter.delete('/users/:id'): Consulta un usuario por identificador Controles: roles: SUPER_ADMIN; permisos: users.manage.
adminRouter.delete('/users/:id',requireRole('SUPER_ADMIN'),requirePermission('users.manage'),handle(async(req,res)=>repository.deactivateAdminUser(actor(res),identifier(req.params.id))));
// adminRouter.post('/users'): Crea un usuario administrativo Controles: roles: ADMIN, SUPER_ADMIN; permisos: users.manage, roles.manage; límite de solicitudes.
adminRouter.post('/users',requirePermission('users.manage','roles.manage'),createAuthRateLimiter(),handle(async(req,res)=>repository.createAdminUser(actor(res),req.body),201));
// adminRouter.post('/users/:id/invitation'): Reenvía la invitación al usuario Controles: roles: SUPER_ADMIN; límite de solicitudes.
adminRouter.post('/users/:id/invitation',requireRole('SUPER_ADMIN'),createAuthRateLimiter(4),handle(async(req,res)=>repository.resendAdminInvitation(actor(res),identifier(req.params.id))));
// adminRouter.put('/users/:id'): Consulta un usuario por identificador Controles: roles: ADMIN, SUPER_ADMIN; permisos: users.manage.
adminRouter.put('/users/:id',requirePermission('users.manage'),handle(async(req,res)=>repository.updateAdminUser(actor(res),identifier(req.params.id),req.body)));
// adminRouter.put('/users/:id/photo'): Actualiza la foto del usuario Controles: roles: ADMIN, SUPER_ADMIN; permisos: users.manage.
adminRouter.put('/users/:id/photo',requirePermission('users.manage'),handle(updateUserPhoto));
// adminRouter.put('/users/:id/permissions'): Actualiza permisos del usuario Controles: roles: ADMIN, SUPER_ADMIN; permisos: users.manage, permissions.manage.
adminRouter.put('/users/:id/permissions',requirePermission('users.manage','permissions.manage'),handle(async(req,res)=>repository.updateUserPermissions(actor(res),identifier(req.params.id),req.body)));
// adminRouter.post('/roles/query'): Lista roles Controles: roles: ADMIN, SUPER_ADMIN; permisos: roles.manage.
adminRouter.post('/roles/query',requirePermission('roles.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
// adminRouter.post('/roles'): Crea un rol Controles: roles: SUPER_ADMIN; permisos: roles.manage, permissions.manage; límite de solicitudes.
adminRouter.post('/roles',requireRole('SUPER_ADMIN'),requirePermission('roles.manage','permissions.manage'),createAuthRateLimiter(),handle(async(req,res)=>repository.createRole(actor(res),req.body),201));
// adminRouter.put('/roles/:id'): Actualiza un rol Controles: roles: ADMIN, SUPER_ADMIN; permisos: roles.manage, permissions.manage.
adminRouter.put('/roles/:id',requirePermission('roles.manage','permissions.manage'),handle(async(req,res)=>repository.updateRole(actor(res),identifier(req.params.id),req.body)));
// adminRouter.delete('/roles/:id'): Actualiza un rol Controles: roles: ADMIN, SUPER_ADMIN; permisos: roles.manage, permissions.manage.
adminRouter.delete('/roles/:id',requirePermission('roles.manage','permissions.manage'),handle(async(req,res)=>repository.deleteCustomRole(actor(res),identifier(req.params.id))));
// adminRouter.post('/permissions/query'): Lista permisos Controles: roles: ADMIN, SUPER_ADMIN; permisos: permissions.manage.
adminRouter.post('/permissions/query',requirePermission('permissions.manage'),handle(async(_req,res)=>repository.adminCatalog(actor(res))));
// adminRouter.post('/products/query'): Lista productos administrativos Controles: permisos: products.update, products.update_stock, products.update_price.
adminRouter.post('/products/query',requireAnyPermission('products.view','products.update','products.update_stock','products.update_price'),handle(async req=>presentProductImages(await repository.adminProducts(req.body))));
// adminRouter.post('/products/catalog'): Consulta categorías de productos Controles: permisos: products.update, products.update_stock, products.update_price.
adminRouter.post('/products/catalog',requireAnyPermission('products.view','products.update','products.update_stock','products.update_price'),handle(async(_req,res)=>repository.adminProductCategories(actor(res))));
// adminRouter.post('/products/:id/stock-movements'): Consulta movimientos de stock del producto Controles: permisos: products.update_stock.
adminRouter.post('/products/:id/stock-movements',requirePermission('products.update_stock'),handle(async(req,res)=>repository.adminProductStockMovements(actor(res),identifier(req.params.id))));
// adminRouter.patch('/products/:id'): Actualiza un producto Controles: permisos: products.update, products.update_stock, products.update_price.
adminRouter.patch('/products/:id',requireAnyPermission('products.update','products.update_stock','products.update_price'),handle(updateProduct));
