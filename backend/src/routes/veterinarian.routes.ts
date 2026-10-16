/** ADMIN/SUPER_ADMIN requieren grants efectivos para gestionar profesionales. */
import { Router, type RequestHandler, type Request, type Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { authenticate } from '../middlewares/auth.middleware';
import { requireRole,requirePermission } from '../middlewares/permission.middleware';
import { createAuthRateLimiter } from '../middlewares/auth-rate-limit.middleware';
import { vetCatalog,vetList,vetDetail,createVet,updateVet,updateVetStatus,updateOwnVetPhoto } from '../repositories/veterinarian.repository';
import { identifier,validateVet,objectBody,textField } from '../validators/veterinarian.validator';
import { acceptInvitation } from '../services/invitation.service';
import * as clinic from '../repositories/clinic.repository';
import { databasePool } from '../config/database';
import { permissionModuleName } from '../utils/catalog-presentation';
import { AppError } from '../utils/app-error';
import { runDatabaseOperation } from '../utils/database-error';
import type { AuthUser } from '../types/auth';
import { isProfilePhotoKey,removeProfilePhoto,storeProfilePhoto } from '../services/pet-photo.service';
import { updateVetPhoto } from '../repositories/veterinarian.repository';
import { changeOwnPassword,updateOwnProfile } from '../services/veterinarian-account.service';

function handler(operation: (request: Request,response: Response) => Promise<unknown>,status=200): RequestHandler {
  return async (request,response,next) => {
    try { response.status(status).json({ success:true,data:await operation(request,response) }); }
    catch(error) { next(error); }
  };
}
export const veterinarianAdminRouter = Router();
veterinarianAdminRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
veterinarianAdminRouter.use(authenticate,requireRole('ADMIN','SUPER_ADMIN'),requirePermission('veterinarians.manage'));
veterinarianAdminRouter.get('/catalog',handler(async ()=>vetCatalog()));
veterinarianAdminRouter.get('/',handler(async req=>vetList(req.query)));
veterinarianAdminRouter.get('/:id',handler(async req=>vetDetail(identifier(req.params.id))));
veterinarianAdminRouter.post('/',createAuthRateLimiter(),handler(async(req,res)=>createVet(validateVet(req.body),res.locals.authenticatedUser as AuthUser),201));
veterinarianAdminRouter.put('/:id',handler(async(req,res)=>updateVet(identifier(req.params.id),validateVet(req.body),res.locals.authenticatedUser as AuthUser)));
veterinarianAdminRouter.put('/:id/photo',handler(async(req,res)=>{
  const body=req.body&&typeof req.body==='object'&&!Array.isArray(req.body)?req.body as Record<string,unknown>:{};
  if(Object.keys(body).some(key=>!['photoBase64','removePhoto'].includes(key))||body.removePhoto!==undefined&&typeof body.removePhoto!=='boolean'||body.removePhoto===true&&body.photoBase64!==undefined)throw new AppError('VALIDATION_ERROR',400,'La solicitud de foto no es válida.');
  const remove=body.removePhoto===true;const image=remove?null:await storeProfilePhoto(body.photoBase64);
  let result:{previous:string|null};
  try {result=await updateVetPhoto(identifier(req.params.id),image?.url??null,res.locals.authenticatedUser as AuthUser);}
  catch(error){if(image)console.error('La actualización del perfil falló; se conservará el objeto nuevo para evitar romper una posible referencia confirmada.');throw error;}
  if(isProfilePhotoKey(result.previous)&&result.previous!==image?.url)await removeProfilePhoto(result.previous).catch(()=>console.error('No se pudo limpiar la foto anterior del veterinario.'));
  return vetDetail(identifier(req.params.id));
}));
veterinarianAdminRouter.patch('/:id/status',handler(async(req,res)=> {
  const body=objectBody(req.body,['isActive']);
  if (typeof body.isActive!=='boolean') throw new AppError('VALIDATION_ERROR',400,'Indicá el estado de la cuenta.');
  return updateVetStatus(identifier(req.params.id),body.isActive,res.locals.authenticatedUser as AuthUser);
}));

export const invitationRouter = Router();
invitationRouter.post('/accept',createAuthRateLimiter(),handler(async req=> { await acceptInvitation(req.body);return { accepted:true }; }));

export const specialtiesAdminRouter = Router();
specialtiesAdminRouter.use(authenticate,requireRole('ADMIN','SUPER_ADMIN'),requirePermission('specialties.manage'));
specialtiesAdminRouter.get('/',handler(async ()=> (await vetCatalog()).specialties));
specialtiesAdminRouter.post('/',handler(async req=>runDatabaseOperation(async ()=> {
  const body=objectBody(req.body,['name']); const name=textField(body.name,'La especialidad',100);
  await databasePool.execute('INSERT INTO specialties (name) VALUES (?)',[name]);return { name };
}),201));
specialtiesAdminRouter.put('/:id',handler(async req=>runDatabaseOperation(async ()=> {
  const body=objectBody(req.body,['name']); const name=textField(body.name,'La especialidad',100);
  const id=identifier(req.params.id);
  const [rows]=await databasePool.execute<RowDataPacket[]>('SELECT id FROM specialties WHERE id=?',[id]);
  if (!rows.length) throw new AppError('NOT_FOUND',404,'Especialidad no encontrada.');
  await databasePool.execute('UPDATE specialties SET name=? WHERE id=?',[name,id]);return { id,name };
})));

/** Un solo panel. El backend entrega módulos accesibles del catálogo según permisos efectivos. */
export const veterinarianPanelRouter = Router();
veterinarianPanelRouter.use((_req,res,next)=>{res.setHeader('Cache-Control','no-store');next();});
veterinarianPanelRouter.use(authenticate,requireRole('VETERINARIAN'));
veterinarianPanelRouter.get('/profile',handler(async(_req,res)=>{const user=res.locals.authenticatedUser as AuthUser;return {user,professional:user.professional,veterinarian:user.veterinarian};}));
veterinarianPanelRouter.patch('/profile',handler(async(req,res)=>updateOwnProfile((res.locals.authenticatedUser as AuthUser).id,req.body)));
veterinarianPanelRouter.put('/profile/password',createAuthRateLimiter(5),handler(async(req,res)=>changeOwnPassword((res.locals.authenticatedUser as AuthUser).id,req.body)));
veterinarianPanelRouter.put('/profile/photo',createAuthRateLimiter(),handler(async(_req,res)=>{
  const body=_req.body&&typeof _req.body==='object'&&!Array.isArray(_req.body)?_req.body as Record<string,unknown>:{};
  if(Object.keys(body).some(key=>!['photoBase64','removePhoto'].includes(key))||body.removePhoto!==undefined&&typeof body.removePhoto!=='boolean'||body.removePhoto===true&&body.photoBase64!==undefined)throw new AppError('VALIDATION_ERROR',400,'La solicitud de foto no es válida.');
  const image=body.removePhoto===true?null:await storeProfilePhoto(body.photoBase64);const user=res.locals.authenticatedUser as AuthUser;
  try {const saved=await updateOwnVetPhoto(user.id,image?.url??null);if(saved.previous&&saved.previous!==image?.url)await removeProfilePhoto(saved.previous).catch(()=>console.error('No se pudo limpiar la foto anterior del veterinario.'));return {profilePhotoUrl:image?.url??null};}
  catch(error){if(image)console.error('La actualización del perfil falló; se conservará el objeto nuevo para evitar romper una posible referencia confirmada.');throw error;}
}));
async function accessibleModules(user: AuthUser) {
  return runDatabaseOperation(async ()=> {
    const codes=user.permissions ?? [];
    if (!codes.length) return [];
    const [rows]=await databasePool.execute<RowDataPacket[]>(`SELECT DISTINCT m.code,m.name,m.sort_order FROM permission_modules m
      JOIN permissions p ON p.module_code=m.code WHERE p.is_critical=0 AND p.opens_module=1 AND p.code IN (${codes.map(()=>'?').join(',')}) ORDER BY m.sort_order`,codes);
    return rows.map(row=>({ code:row.code as string,name:permissionModuleName(row.code as string,row.name as string) }));
  });
}
veterinarianPanelRouter.get('/home',handler(async (_req,res)=> {
  const user=res.locals.authenticatedUser as AuthUser;
  // Compatibilidad del panel existente sobre la clínica compartida.
  return { veterinarian:user.veterinarian,modules:await accessibleModules(user),
    clinicalAvailable:true,...await clinic.home(user) };
}));
veterinarianPanelRouter.get('/modules/:module',handler(async (req,res)=> {
  const modules=await accessibleModules(res.locals.authenticatedUser as AuthUser);
  const module=modules.find(item=>item.code===req.params.module);
  if (!module) throw new AppError('FORBIDDEN',403,'No tenés permiso para acceder a este módulo.');
  return { module,clinicalAvailable:true };
}));
